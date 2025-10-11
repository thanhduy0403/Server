const router = require("express").Router();
const voucherControllers = require("../../Controllers/User/voucherControllers");

// get list voucher
router.get("/getList", voucherControllers.getListVoucher);

module.exports = router;
