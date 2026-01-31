const router = require("express").Router();
const authControllers = require("../../Controllers/User/authControllers");
const { verifyToken, protectRouter } = require("../../middleware/verifyToken");

// register
router.post("/register", authControllers.registerUser);
//login
router.post("/login", authControllers.LoginUser);

// login facebook
router.post("/login_facebook", authControllers.loginFacebook);
// update profile
router.patch("/update_profile", protectRouter, authControllers.updateProfile);

// detete user
router.delete("/:id", protectRouter, authControllers.deleteUser);
// logout
router.get("/logout", protectRouter, authControllers.logout);

//
router.get("/profile", protectRouter, authControllers.getProfile);

/////
// signUp
router.post("/signup", authControllers.Signup);
//signIp
router.post("/signin", authControllers.Signin);
//fetch me
router.get("/fetchme", protectRouter, authControllers.fetchMe);
router.post("/refresh", authControllers.refreshToken);
module.exports = router;
