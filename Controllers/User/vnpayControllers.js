const { VNPay, HashAlgorithm, ProductCode } = require("vnpay");
const Order = require("../../model/order");
const renderPaymentResultPage = require("../../utils/renderPaymentResultPage");

const vnpay = new VNPay({
  // ⚡ Cấu hình bắt buộc
  tmnCode: "H0HKG0HO",
  secureSecret: "S4RE1WBDYT63XIKY5D1L8GXMCPZAD7Q7",
  vnpayHost: "https://sandbox.vnpayment.vn",

  // 🔧 Cấu hình tùy chọn
  testMode: true, // Chế độ test
  hashAlgorithm: "SHA512", // Thuật toán mã hóa
  enableLog: true, // Bật/tắt log
  //   loggerFn: ignoreLogger, // Custom logger
});

const VNPayControllers = {
  createPaymentURL: async (req, res) => {
    try {
      const { orderID } = req.params;
      const order = await Order.findById(orderID);
      if (!order) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy đơn hàng" });
      }
      const paymentURL = vnpay.buildPaymentUrl({
        vnp_Amount: order.finalPrice,
        vnp_TxnRef: order._id.toString(),
        vnp_OrderInfo: `Thanh toán đơn hàng #${order._id}`,
        vnp_IpAddr: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
        vnp_Locale: "vn",
        vnp_OrderType: ProductCode.Other,
        vnp_ReturnUrl: "http://localhost:5000/v1/user/pay/vnpay_return", // <-- chuyển đến trang thông báo
      });

      return res.status(200).json({ success: true, paymentURL });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
  paymentReturn: async (req, res) => {
    const verified = vnpay.verifyReturnUrl(req.query);
    if (!verified) {
      return res.send(
        renderPaymentResultPage({
          success: false,
          errorCode: "Xác thực thất bại",
        })
      );
    }
    const orderId = req.query.vnp_TxnRef;
    if (req.query.vnp_ResponseCode === "00") {
      // Cập nhật trạng thái đơn hàng tại đây nếu cần
      return res.send(renderPaymentResultPage({ success: true, orderId }));
    } else {
      return res.send(
        renderPaymentResultPage({
          success: false,
          errorCode: req.query.vnp_ResponseCode,
        })
      );
    }
  },
};

module.exports = VNPayControllers;
