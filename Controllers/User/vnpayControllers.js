const { VNPay, HashAlgorithm, ProductCode } = require("vnpay");
const Order = require("../../model/order");
const renderPaymentResultPage = require("../../utils/renderPaymentResultPage");
const User = require("../../model/User");
const Product = require("../../model/product");
const Cart = require("../../model/cart"); // ✅ BỔ SUNG
const Voucher = require("../../model/Voucher"); // ✅ BỔ SUNG
const Category = require("../../model/category"); // ✅ BỔ SUNG
const { getIO } = require("../../socket"); // ✅ QUAN TRỌNG - Import getIO

const vnpay = new VNPay({
  tmnCode: "H7A4Y81V",
  secureSecret: "JLM8KV0KBHZLBWS2I9YA6J69JTG3NB1J",
  vnpayHost: "https://sandbox.vnpayment.vn",
  testMode: true,
  hashAlgorithm: "SHA512",
  enableLog: true,
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
        vnp_ReturnUrl: "http://localhost:5000/v1/user/pay/vnpay_return",
      });

      return res.status(200).json({ success: true, paymentURL });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  paymentReturn: async (req, res) => {
    try {
      const verified = vnpay.verifyReturnUrl(req.query);
      const orderId = req.query.vnp_TxnRef;
      const responseCode = req.query.vnp_ResponseCode;

      console.log(" VNPay Return - OrderID:", orderId);
      console.log(" Response Code:", responseCode);
      console.log("Verified:", verified);

      const order = await Order.findById(orderId).populate("products.product");
      const user = order ? await User.findById(order.userInfo) : null;
      const cartID = order ? order.cartID : null;

      if (!verified || !order || !user) {
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
      }

      // ✅ Thanh toán thành công
      if (responseCode === "00") {
        console.log(" VNPay thanh toán thành công");

        if (order.paymentStatus === "Đang Chờ") {
          try {
            // 1. Trừ điểm đã dùng
            user.point -= order.pointsUser || 0;
            // 2. Cộng điểm thưởng
            // user.point += 200;
            await user.save();
            console.log("Đã cập nhật điểm user");

            // 3. Giảm voucher
            if (order.voucherApplied) {
              const voucher = await Voucher.findById(order.voucherApplied);
              if (voucher) {
                voucher.quantity = Math.max(0, voucher.quantity - 1);
                await voucher.save();
                console.log("✅ Đã giảm voucher");
              }
            }

            // 4. Giảm số lượng sản phẩm trong kho
            for (const item of order.products) {
              const product = await Product.findById(item.product);
              if (!product) continue;

              if (product.sizes && product.sizes.length > 0 && item.size) {
                const sizeIndex = product.sizes.findIndex(
                  (s) => s.size === item.size
                );
                if (sizeIndex !== -1) {
                  const currentQuantity =
                    product.sizes[sizeIndex].quantity || 0;
                  product.sizes[sizeIndex].quantity = Math.max(
                    0,
                    currentQuantity - item.quantity
                  );
                }
              } else {
                product.stock = Math.max(
                  0,
                  (product.stock || 0) - item.quantity
                );
              }

              product.soldCount = (product.soldCount || 0) + item.quantity;

              if (product.categoryID) {
                await Category.findByIdAndUpdate(
                  product.categoryID,
                  { $inc: { soldCount: item.quantity } },
                  { new: true }
                );
              }

              await product.save();
            }
            console.log("✅ Đã cập nhật kho");

            // 5. Cập nhật trạng thái đơn hàng
            order.paymentStatus = "Thành Công";
            order.orderStatus = "Đã Xác Nhận";
            await order.save();
            console.log("✅ Đã cập nhật trạng thái đơn hàng");

            // 6. Xóa giỏ hàng
            if (cartID) {
              await Cart.findByIdAndDelete(cartID);
              console.log("✅ Đã xóa giỏ hàng");
            }

            // ✅ EMIT SOCKET SAU KHI THANH TOÁN VNPAY THÀNH CÔNG
            try {
              const io = getIO();
              io.to("admins").emit("new_order", {
                message: "Bạn có đơn hàng mới",
                newOrder: order,
              });
              console.log("✅ ĐÃ GỬI SOCKET THÔNG BÁO CHO ADMIN");
            } catch (socketError) {
              console.error("❌ Lỗi khi gửi socket:", socketError);
            }
          } catch (error) {
            console.error("❌ Lỗi xử lý sau VNPay:", error);
          }
        } else {
          console.log("⚠️ Order đã được xử lý trước đó:", order.paymentStatus);
        }

        return res.send(renderPaymentResultPage({ success: true, orderId }));
      } else {
        // ❌ Thanh toán thất bại
        console.log("❌ VNPay thanh toán thất bại - Code:", responseCode);

        if (order.paymentStatus === "Đang Chờ") {
          order.paymentStatus = "Thất Bại";
          order.orderStatus = "Đã Hủy";
          await order.save();
        }

        return res.send(
          renderPaymentResultPage({
            success: false,
            errorCode: responseCode,
          })
        );
      }
    } catch (error) {
      console.error("❌ Lỗi tổng thể trong paymentReturn:", error);
      return res.send(
        renderPaymentResultPage({
          success: false,
          errorCode: "Lỗi hệ thống",
        })
      );
    }
  },
};

module.exports = VNPayControllers;
