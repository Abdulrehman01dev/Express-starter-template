const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require("crypto");
const validator = require('validator');
const { Schema } = mongoose;
const roleEnum = {
  US: 'User',
  AD: 'Admin',
};

function toLower(email) {
  if(!email) return email
  return email.toLowerCase();
}
const userSchema = new Schema({
  name: {
    type: String,
    required: true
},
  email:{
    type:String,
    unique: true,
    required: true,
    set:toLower,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  contact:{
    type:String,
    required: true
  },
  password: {
    type: String,
    required: true,
    select:false
  },
  role: {
    type:String,
    enum: Object.keys(roleEnum),
    default: Object.keys(roleEnum)[0]
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }

},{
  timestamps:true,
  versionKey: false,
});
userSchema.virtual('role_value').get(function() {
  return roleEnum[this.role];
});

// Ensure that virtuals are included when converting the document to JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});


userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", userSchema);