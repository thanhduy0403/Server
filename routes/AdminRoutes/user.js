const router = require("express").Router();
const userControllers = require("../../Controllers/Admin/userControllers");
const {
  verifyToken,
  verifyTokenAdmin,
  verifyTokenAdminAndUser,
  checkPermission,
} = require("../../middleware/verifyToken");

// Register
router.post("/register", userControllers.registerUser);
//Login
router.post("/login", userControllers.loginUser);
// logout
router.get("/logout", verifyToken, userControllers.logout);
// get all user
router.get(
  "/getList",
  verifyTokenAdmin,
  checkPermission,
  userControllers.getAllUser
);
// get detail user
router.get("/:id", verifyTokenAdmin, userControllers.getDetailUser);

// delete user
router.delete(
  "/:id",
  verifyTokenAdmin,
  checkPermission,
  userControllers.deleteUser
);

module.exports = router;
