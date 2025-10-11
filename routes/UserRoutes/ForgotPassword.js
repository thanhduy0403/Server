const ForgotPasswordControllers = require("../../Controllers/User/ForgotPassword");

const router = require("express").Router();

// router.get("/forgotpassword", ForgotPasswordControllers.forgotPassword);
router.put("/resetpassword", ForgotPasswordControllers.resetPassword);
router.get("/sendOTP", ForgotPasswordControllers.sendOTP);
router.post("/verifyOTP", ForgotPasswordControllers.verifyOTP);
module.exports = router;
