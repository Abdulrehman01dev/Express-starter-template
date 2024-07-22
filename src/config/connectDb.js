const mongoose = require("mongoose");
const { customCastPlugin } = require("../utils/modelHelpers");
const dotenv = require('dotenv').config();
require('colors');
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 60000,
    });
    for (const [modelName, model] of Object.entries(mongoose.models)) {
      model.schema.plugin(customCastPlugin);
    }
    console.log("Connected to MongoDB".green.bold);
  } catch (error) {
    console.error("Error connecting to MongoDB:".red.bold, error.message);
  }
};

module.exports = connectDB;
