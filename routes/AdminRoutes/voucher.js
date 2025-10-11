const router = require("express").Router();
const voucherControllers = require("../../Controllers/Admin/voucherControllers");
const {
  verifyTokenAdmin,
  checkPermission,
} = require("../../middleware/verifyToken");

// create voucher
router.post(
  "/createVoucher",
  verifyTokenAdmin,
  checkPermission,
  voucherControllers.postVoucher
);
// get list voucher
router.get(
  "/getList",
  verifyTokenAdmin,
  checkPermission,
  voucherControllers.getListVoucher
);
// delete voucher
router.delete(
  "/:id",
  verifyTokenAdmin,
  checkPermission,
  voucherControllers.deleteVoucher
);
// update voucher
router.patch(
  "/:id",
  verifyTokenAdmin,
  checkPermission,
  voucherControllers.updateVoucher
);
module.exports = router;
