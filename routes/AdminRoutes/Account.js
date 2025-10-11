const router = require("express").Router();
const accountControllers = require("../../Controllers/Admin/accountControllers");
const {
  verifyToken,
  checkPermission,
  verifyTokenOnLyAdmin,
  verifyTokenAdmin,
} = require("../../middleware/verifyToken");

// create Account
router.post(
  "/createAccount",
  verifyTokenAdmin,
  checkPermission,
  accountControllers.createAccount
);

// login Account
router.post("/loginAccount", accountControllers.loginAccount);

// logout account
router.get("/logoutAccount", verifyToken, accountControllers.logoutAccount);

// Account List
router.get(
  "/getList",
  verifyTokenAdmin,
  checkPermission,
  accountControllers.getAllAccount
);

// getDetail Account

router.get(
  "/:id",
  verifyTokenAdmin,
  checkPermission,
  accountControllers.getDetailAccount
);

// update Account
router.patch(
  "/:id",
  verifyTokenAdmin,
  checkPermission,
  accountControllers.updateAccount
);

// delete account
router.delete(
  "/:id",
  verifyTokenAdmin,
  checkPermission,
  accountControllers.deleteAccount
);
module.exports = router;
