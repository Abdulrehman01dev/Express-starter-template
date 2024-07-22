const User = require("../models/User");
const jwt = require("jsonwebtoken");
const factory = require("./handlerFactory");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const crypto = require("crypto");
const sendEmail = require("./../utils/email");
const { getAsBool } = require("../utils/helpers");
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  user=user.toObject()
  const excludedFields = ["password", "passwordChangedAt"];
  excludedFields.forEach((el) => delete user[el]);
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  res.status(statusCode).json({
    status: "success",
    token,
    data:user
  });
};

const registerUser = catchAsync(async (req, res, next) => {
  const { name, email, password, contact } = req.body;
  const oldEmail = await User.findOne({email});

  if (oldEmail) return next(new AppError("Email already exists", 400));

  const newUser = await User.create({
    name,
    email,
    contact,
    password,
  });

  createSendToken(newUser, 201, res);
});

const loginUser = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }
  const user = await User.findOne({email}).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
});
const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  // 1) Check if email and password exist
  if (!email) {
    return next(new AppError("Please provide email!", 400));
  }
  // 1) Get user based on POSTed email
  const user = await User.findOne({email});
  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  let resetMethodServer = process.env.RP_SERVER;
  let resetURL;
  if (getAsBool(resetMethodServer)) {
    resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/auth/resetPassword/${resetToken}`;
  } else {
    resetURL = `${process.env.FORGET_URL_FRONT}/${resetToken}`;
  }

  try {
    await new sendEmail(user.email, "", resetURL).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
});

const resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});
// to reset password from backend form
const resetPasswordBackend = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.render("error", { message: "Token is invalid or has expired" });
  }

  res.render("ResetPassword", { token: req.params.token });
});
//to change password using data received from backend form
const resetPasswordFormSubmit = catchAsync(async (req, res, next) => {
  console.log("reset", req.body);
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.body.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.render("error", { message: "Token is invalid or has expired" });
  }
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  console.log(user);
  res.render("success", { message: "Password reset successfully" });
});
const updatePassword = catchAsync(async (req, res, next) => {
  const { passwordCurrent } = req.body;
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select("+password");
  console.log(user);
  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }
  if (await user.correctPassword(req.body.password, user.passwordCurrent)) {
    // Password has not changed, do not increment the password version
    return next(
      new AppError(
        "Your new password must be different from the current one.",
        400
      )
    );
  }
  user.password = req.body.password;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT

  createSendToken(user, 200, res);
});

const getUser = catchAsync(async (req, res, next) => {
  const { _id } = req.user;
  const response = await User.findById(_id);
  res.status(200).send(response);
});

const updateUser = catchAsync(async (req, res, next) => {
  const field =[ "name", "contact"]
  const extractedData = {};

  for (const key of field) {
    if (req.body[key]) {
      extractedData[key] = req.body[key];
    }
  }

  const result = await User.findByIdAndUpdate(req.user.id, extractedData);
  res.status(200).send({
    status: "success",
    result,
  });
});

module.exports = {
  registerUser,
  loginUser,
  updateUser,
  getUser,
  getAllUsers: factory.getAll(User),
  getUserById: factory.getOne(User),
  putUser:factory.updateOne(User),
  deleteUser:factory.deleteOne(User),
  forgotPassword,
  resetPassword,
  updatePassword,
  resetPasswordBackend,
  resetPasswordFormSubmit,
};
