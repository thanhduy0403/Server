const router = require("express").Router();
const {
  verifyToken,
  verifyTokenAdmin,
  checkPermission,
} = require("../../middleware/verifyToken");
const orderController = require("../../Controllers/Admin/orderController");

// create order
router.post("/:id", verifyToken, orderController.createOder);

// get list order all user
router.get(
  "/getList",
  verifyTokenAdmin,
  checkPermission,
  orderController.getList
);

// get create order by user
router.get("/getCreateBy", verifyToken, orderController.getCreateByUser);

// cancel order
router.delete(
  "/:id",
  verifyToken,
  checkPermission,
  orderController.cancel_Order
);

//confirm order
router.patch(
  "/:id",
  verifyTokenAdmin,
  checkPermission,
  orderController.confirm_Order
);

module.exports = router;
