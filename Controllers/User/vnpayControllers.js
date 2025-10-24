const { VNPay, HashAlgorithm, ProductCode } = require("vnpay");
const Order = require("../../model/order");
const renderPaymentResultPage = require("../../utils/renderPaymentResultPage");
const User = require("../../model/User");

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
    const orderId = req.query.vnp_TxnRef;
    const responseCode = req.query.vnp_ResponseCode; // Mã phản hồi của VNPay // Tìm đơn hàng

    const order = await Order.findById(orderId);
    const user = order ? await User.findById(order.userInfo) : null;
    const cartID = order ? order.cartID : null;

    if (!verified || !order || !user) {
      // Thậm chí nếu xác thực thất bại, vẫn cố gắng cập nhật trạng thái đơn hàng nếu tìm thấy
      if (order) {
        order.paymentStatus = "Thất Bại";
        await order.save();
      }
      return res.send(
        renderPaymentResultPage({
          success: false,
          errorCode: "Xác thực thất bại/Không tìm thấy đơn hàng",
        })
      );
    } // Nếu thanh toán thành công
    if (responseCode === "00") {
      // Kiểm tra tránh xử lý trùng lặp
      if (order.paymentStatus === "Đang Chờ") {
        try {
          // 1. Xử lý thành công đơn hàng (trừ điểm, cộng thưởng, giảm kho/voucher)
          // *Gọi hàm processOrderSuccess đã định nghĩa ở trên (bạn cần import)
          await processOrderSuccess(order, user); // 2. Cập nhật trạng thái
          order.paymentStatus = "Thành Công";
          order.orderStatus = "Đã Xác Nhận"; // Chuyển sang đã xác nhận vì đã thanh toán
          await order.save(); // 3. Xóa giỏ hàng
          await Cart.findByIdAndDelete(cartID);
        } catch (error) {
          console.error("Lỗi xử lý điểm/kho sau VNPay:", error); // Có thể log lỗi nhưng vẫn trả về thành công cho người dùng
        }
      } // Trả về trang thông báo
      return res.send(renderPaymentResultPage({ success: true, orderId }));
    } else {
      // Thanh toán thất bại (vnp_ResponseCode !== "00")
      if (order.paymentStatus === "Đang Chờ") {
        order.paymentStatus = "Thất Bại";
        order.orderStatus = "Đã Hủy"; // Đơn hàng bị hủy nếu thanh toán thất bại
        await order.save();
      }
      return res.send(
        renderPaymentResultPage({
          success: false,
          errorCode: responseCode,
        })
      );
    }
  },
};

module.exports = VNPayControllers;
