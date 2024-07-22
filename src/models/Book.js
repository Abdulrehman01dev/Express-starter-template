const mongoose=require("mongoose");
const { mongooseCustomErrors } = require("../utils/modelHelpers");
mongoose.Error.messages = mongooseCustomErrors
const schema=new mongoose.Schema({
    name:{
        type:String,
        unique:true,
        required:true,
        minLength:4,
        
    },
    price:{
        type:Number,
        required:true,
        minLength:10
    },
})

module.exports=mongoose.model("Book",schema)