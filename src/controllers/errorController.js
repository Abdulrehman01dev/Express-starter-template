const sendEmail = require("../utils/sendEmail");
const AppError = require("./../utils/appError");
require("dotenv").config();

// Handle casting errors for MongoDB
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return [message, 400];
};

// Handle duplicate field errors for MongoDB
const handleDuplicateFieldsDB = (err) => {
  const keyPattern = err.keyPattern;
  const field = Object.keys(keyPattern)[0];
  const message = {
    [field]: [`Duplicate field value.`],
  };
  return [message,400];
};


// Handle validation errors for MongoDB
const handleValidationErrorDB = (err) => {
  const fieldErrors = {};
  for (const field in err.errors) {
    fieldErrors[field] = [err.errors[field].message];
  }
  return [fieldErrors, 400];
};

// Handle JWT errors
const handleJWTError = () => ["Invalid token. Please log in again!", 401];
const handleJWTExpiredError = () => [
  "Your token has expired! Please log in again.",
  401,
];

// Send error response in production environment
const sendError = (err, error, req, res) => {
  if (err.isOperational&&err.message) {
    return res.status(err.statusCode).send({
      status: err.status,
      message: err.message
    });
  }
  return res.status(err.statusCode).json({
    status: err.status,
    message: error,
  });
};

module.exports = (err, req, res, next) => {
  let error = {};
  let errorResult;
  err.status = err.status || "error";
  const isDebug = process.env.NODE_ENV !== "production";

  if (err.name === "CastError") errorResult = handleCastErrorDB(err);
  if (err.code === 11000) errorResult = handleDuplicateFieldsDB(err);
  if (err.name === "ValidationError")
    errorResult = handleValidationErrorDB(err);
  if (err.name === "JsonWebTokenError") errorResult = handleJWTError();
  if (err.name === "TokenExpiredError") errorResult = handleJWTExpiredError();
let resArrValid=Array.isArray(errorResult)
  if (isDebug) {
    if (!resArrValid) error = err;
    else error = errorResult[0];
  } else {
    if (!resArrValid) error = "Internal Server Error";
    else error = errorResult[0];
    sendEmail(process.env.ERROR_SEND_EMAIL,"Backend",err)

  }
  err.statusCode = err.statusCode ||resArrValid&&errorResult[1] || 500;
  console.log(error);
  sendError(err, error, req, res);
};
