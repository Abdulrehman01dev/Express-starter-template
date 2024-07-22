
const express = require("express");

const {
  addBook,
  putBook,
  deleteBook,
  getBook,
  getAllBooks,
} = require("../controllers/bookController");
const requireAuth = require("../middlewares/requireAuth");
const restrictTo = require("../middlewares/restrictTo");
const { uploadMulter, uploadHandler } = require("../utils/uploadHelper");
const ReferenceUser = require("../utils/ReferenceUser");

const router = express.Router();

router.post("/", addBook);
router.get("/", getAllBooks);
router.get("/:id", getBook);
router.put("/:id", putBook);
router.delete("/:id", deleteBook);

module.exports = router;
