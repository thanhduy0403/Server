const { verifyToken } = require("../../middleware/verifyToken");
const router = require("express").Router();
const VNPayControllers = require("../../Controllers/User/vnpayControllers");

router.get("/vnpay/:orderID", verifyToken, VNPayControllers.createPaymentURL);

// 🔹 Bước 3: VNPay redirect về URL này sau khi thanh toán xong
router.get("/vnpay_return", VNPayControllers.paymentReturn);

module.exports = router;
