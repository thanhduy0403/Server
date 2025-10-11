const router = require("express").Router();
const authControllers = require("../../Controllers/User/authControllers");
const { verifyToken } = require("../../middleware/verifyToken");

// register
router.post("/register", authControllers.registerUser);
//login
router.post("/login", authControllers.LoginUser);

// update profile
router.patch("/update_profile", verifyToken, authControllers.updateProfile);
// logout
router.get("/logout", verifyToken, authControllers.logout);

module.exports = router;
