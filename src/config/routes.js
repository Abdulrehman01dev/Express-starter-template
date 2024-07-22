const { authRoute, bookRoutes } = require("../routes");
const otherRoutes = require("./otherRoutes");

module.exports = function (app) {
  app.use("/api/auth", authRoute);
  app.use("/api/book", bookRoutes);

  otherRoutes(app);
};
