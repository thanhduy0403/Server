const router = require("express").Router();
const authControllers = require("../../Controllers/User/authControllers");
const { verifyToken } = require("../../middleware/verifyToken");

// register
router.post("/register", authControllers.registerUser);
//login
router.post("/login", authControllers.LoginUser);

// update profile
router.patch("/update_profile", verifyToken, authControllers.updateProfile);

// detete user
router.delete("/:id", verifyToken, authControllers.deleteUser);
// logout
router.get("/logout", verifyToken, authControllers.logout);

//
router.get("/profile", verifyToken, authControllers.getProfile);

module.exports = router;
