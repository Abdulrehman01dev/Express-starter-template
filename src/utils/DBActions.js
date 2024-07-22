const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const catchAsync = require("./catchAsync");
const Email = require("./email");

const Populate = catchAsync(async (req, res, next) => {

  // const user = new User({
  //   name: "Alex",
  //   email: "1@example.com",
  //   contact:"7807324087",
  //   password: "aszx1234",
  //   role: "AD",
  // });
  // await user.save();
//  await sendEmail("gilljee813@gmail.com","Pet Report","Your Report has been generated")
//  console.log("send");

// await new Email("gilljee813@gmail.com","hasnat", "fb.com").sendReport({technician:"John2",barcode:"897324328"});
// console.log("send")

});



module.exports = {
  Populate,
}
