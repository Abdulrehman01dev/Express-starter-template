const express = require("express");

const { registerUser, loginUser, getAllUsers, getUserById, putUser, deleteUser, updateUser, getUser, forgotPassword, resetPassword, updatePassword, resetPasswordFormSubmit, resetPasswordBackend } = require("../controllers/authController");
const requireAuth = require("../middlewares/requireAuth");
const restrictTo = require("../middlewares/restrictTo");
const { uploadMulter, uploadHandler } = require("../utils/uploadHelper");
const ReferenceUser = require("../utils/ReferenceUser");

const validateRequiredFields = require("../middlewares/validateFields");
const { getAsBool } = require("../utils/helpers");

const requiredFields = ["name", "email", "contact", "password"];

const router = express.Router();
router.post("/register", validateRequiredFields(requiredFields), registerUser);
router.post("/login", validateRequiredFields(["email", "password"]), loginUser);
router.get("/user-info", requireAuth, getUser);
router.put("/user", requireAuth, updateUser);
router.get("/user",  requireAuth, restrictTo("AD"), getAllUsers);
router.get("/user/:id",  requireAuth, restrictTo("AD"), getUserById);
router.put("/user/:id",  requireAuth, restrictTo("AD"), putUser);
router.delete("/user:id",  requireAuth, restrictTo("AD"), deleteUser);

router.post('/forgotPassword',forgotPassword);
if(getAsBool(process.env.RP_SERVER)){
  router.get('/resetPassword/:token',resetPasswordBackend);
  router.post('/resetPassword/',resetPasswordFormSubmit);

}else{
  router.patch('/resetPassword/:token', resetPassword);
}


router.patch('/updateMyPassword',requireAuth, updatePassword);

module.exports = router;
