
const Book = require("../models/Book");
const factory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsync");

module.exports = {
  addBook: factory.createOne(Book),
  putBook: factory.updateOne(Book),
  deleteBook: factory.deleteOne(Book),
  getBook: factory.getOne(Book),
  getAllBooks: factory.getAll(Book),
};
