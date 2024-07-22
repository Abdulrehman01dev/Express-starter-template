require("dotenv").config();
const connectDB = require("./config/connectDb");
const express = require("express");
const configMiddlewares = require("./config/configMiddlewares");
const routes = require("./config/routes");
const { Populate } = require("./utils/DBActions");
const app = express();

// Use the middlewares
configMiddlewares(app);

// Use the routes
routes(app);
// Connect to the database
connectDB();

Populate();
