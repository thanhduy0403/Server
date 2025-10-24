const Order = require("../../model/order");
const Cart = require("../../model/cart");
const Product = require("../../model/product");
const Category = require("../../model/category");
const Voucher = require("../../model/Voucher");
const User = require("../../model/User");
const orderControllers = {
  createOrder: async (req, res) => {
    const cartID = req.params.id;
    const {
      address,
      username_Receive,
      phoneNumber,
      paymentMethod,
      note,
      voucherID,
      pointsUser,
    } = req.body;
    const checkCartID = await Cart.findById(cartID).populate(
      "products.product"
    );
    try {
      if (!username_Receive || !phoneNumber || !paymentMethod) {
        return res
          .status(400)
          .json({ success: false, message: "Vui lòng điền đầy đủ thông tin" });
      }
      if (!checkCartID || checkCartID.length === 0) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy giỏ hàng" });
      }
      const totalPriceProducts = checkCartID.products.reduce(
        (sum, item) =>
          sum +
          item.quantity * (item.product.discountedPrice || item.product.price),
        0
      );

      let discountAmount = 0; // được giảm giá bao nhiêu
      let appliedVoucher = null; // có voucher hay không
      if (voucherID) {
        appliedVoucher = await Voucher.findById(voucherID);
        const now = new Date();
        if (appliedVoucher.expiryDate < now) {
          return res
            .status(400)
            .json({ success: false, message: "Voucher đã quá hạn" });
        }
        if (appliedVoucher.quantity <= 0) {
          return res
            .status(400)
            .json({ success: false, message: "Voucher đã hết hạn" });
        }
        if (
          appliedVoucher &&
          totalPriceProducts >= appliedVoucher.minOrderValue
        ) {
          // tính voucher sẽ được giảm giá bao nhiêu tiền
          discountAmount =
            (totalPriceProducts * appliedVoucher.discountValue) / 100;
        }
        if (
          // nếu mà giảm giá được 120k nhưng maxDiscount === 100k thì discountAmount === 100k
          discountAmount > appliedVoucher.maxDiscount
        ) {
          discountAmount = appliedVoucher.maxDiscount;
        }
      }

      // giảm giá từ điểm tích nếu có
      const VALUE_PER_POINT = 1;
      let discountFromPoints = 0;
      const user = await User.findById(req.user.id);
      if (pointsUser && pointsUser > 0) {
        if (user.point < pointsUser) {
          res.status(403).json({
            success: false,
            message: "Điểm tích lũy bạn không đủ",
          });
        }
      }
      // tính tiền giảm theo điểm
      discountFromPoints = pointsUser * VALUE_PER_POINT;

      // trừ điểm
      user.point -= pointsUser;
      await user.save();

      // tính lại số tiền sau khi thêm voucher và thêm points nếu có
      const finalPrice =
        totalPriceProducts - discountAmount - discountFromPoints;
      const newOrder = Order({
        userInfo: req.user.id,
        note: note,
        cartID: cartID,
        address: {
          province: address.province,
          district: address.district,
          ward: address.ward,
          street: address.street,
        },
        username_Receive: username_Receive,
        phoneNumber: phoneNumber,
        paymentMethod: paymentMethod,
        orderStatus: "Chưa Xác Nhận",
        products: checkCartID.products.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.price,
          size: item.size || null,
          stock: !item.size ? item.quantity : null,
          discountedPrice: item.product.discountedPrice,
          nameSnapshot: item.product.name,
          discount: item.product.discount,
        })),
        totalPriceProduct: totalPriceProducts,
        discountAmount, // được giảm giá bao nhiêu tiền
        finalPrice, // giá tiền cần phải trả
        voucherApplied: appliedVoucher ? appliedVoucher._id : null, // nếu có voucher thì lấy còn không thì thôi
        pointsUser: pointsUser ? pointsUser : 0,
      });

      await newOrder.save();
      // tăng điểm sau khi order
      if (user) {
        user.point += 200; // cộng thưởng
        await user.save();
      }
      if (appliedVoucher) {
        appliedVoucher.quantity = Math.max(0, appliedVoucher.quantity - 1);
        await appliedVoucher.save();
      }
      // giảm số lượng sản phẩm ở kho sau khi order thành công
      // sử dụng for of để lặp qua từng sản phẩm ở model cart
      for (const item of checkCartID.products) {
        const product = await Product.findById(item.product._id);
        // tránh trường hợp bị âm nếu order sản phẩm quá số lượng thì trả về  0
        // product.amount =  math.max(0, product.amount - item.quantity)
        if (product.sizes && product.sizes.length > 0 && item.size) {
          const sizeIndex = product.sizes.findIndex(
            (s) => s.size === item.size
          );
          if (sizeIndex !== -1) {
            // các size hiện tại trong kho
            const currentQuantity = product.sizes[sizeIndex].quantity || 0;
            product.sizes[sizeIndex].quantity = Math.max(
              0,
              currentQuantity - item.quantity
            );
          }
        } else {
          product.stock = Math.max(0, (product.stock || 0) - item.quantity);
        }
        product.soldCount = (product.soldCount || 0) + item.quantity;
        if (product.categoryID) {
          await Category.findByIdAndUpdate(
            product.categoryID,
            {
              $inc: { soldCount: item.quantity },
            },
            { new: true }
          );
        }

        await product.save();
      }
      await Cart.findByIdAndDelete(cartID);
      return res.status(200).json({
        success: true,
        message: "Order thành công",
        order: newOrder,
        finalPrice,
        currentPoints: user.point,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Error" });
    }
  },

  getCreateByUser: async (req, res) => {
    const userID = req.user.id;
    try {
      const getByUser = await Order.find({ userInfo: userID })
        .sort({ createdAt: -1 })
        .populate({
          path: "cartID",
          populate: [{ path: "userInfo", select: "username" }],
        })
        .populate({
          path: "products.product",
          select: "name price discount image",
        });
      if (getByUser.length === 0) {
        return res
          .status(200)
          .json({ success: true, message: "Chưa có sản phẩm order" });
      }
      return res
        .status(200)
        .json({ success: true, message: "Danh sách order", getByUser });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Order" });
    }
  },
  getDetailOrder: async (req, res) => {
    const orderID = req.params.id;
    try {
      const findOderID = await Order.findById(orderID)
        .populate({
          path: "cartID",
          populate: [{ path: "userInfo", select: "userName" }],
        })
        .populate({
          path: "products.product",
          select: "name price discount image",
        });
      if (!findOderID) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy đơn hàng" });
      }
      return res.status(200).json({ success: true, findOderID });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ success: false, message: "Không tìm thấy đơn hàng" });
    }
  },

  updateOrder: async (req, res) => {
    const orderID = req.params.id;
    const {
      province,
      ward,
      street,
      district,
      username_Receive,
      phoneNumber,
      note,
    } = req.body;
    try {
      if (!username_Receive || !phoneNumber) {
        return res
          .status(400)
          .json({ success: false, message: "Vui lòng điền đầy đủ thông tin" });
      }
      const checkOrderID = await Order.findById(orderID);
      if (!checkOrderID) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy đơn hàng" });
      }

      const allowUpdate = ["Chưa Xác Nhận", "Đã Xác Nhận"];
      const address = { street, province, district, ward };
      if (allowUpdate.includes(checkOrderID.orderStatus.toString())) {
        const newUpdateOrder = await Order.findByIdAndUpdate(
          orderID,
          {
            address: address,
            phoneNumber: phoneNumber,
            username_Receive: username_Receive,
            note: note,
            address: address,
          },
          { new: true }
        );
        await newUpdateOrder.save();
        return res.status(200).json({
          success: true,
          message: "Cập nhật thành công",
          newUpdateOrder,
        });
      } else {
        return res.json({
          success: false,
          message: `Đơn hàng đã ở trang thái ${checkOrderID.orderStatus} không thể thay đổi`,
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Error" });
    }
  },

  confirm_Received: async (req, res) => {
    const orderID = req.params.id;
    const { receivedStatus } = req.body;
    try {
      const order = await Order.findById(orderID);
      if (!order) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy order" });
      }
      if (order.orderStatus !== "Hoàn Thành") {
        return res.status(400).json({
          success: false,
          message: "Đơn hàng của bạn chưa hoàn thành",
        });
      }

      const confirmOrder = await Order.findByIdAndUpdate(
        orderID,
        {
          receivedStatus: receivedStatus || "Đã Nhận",
        },
        { new: true }
      );
      await confirmOrder.save();
      return res.status(200).json({
        success: true,
        message: "Xác nhận nhận hàng thành công",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },
  cancel_Order: async (req, res) => {
    const orderID = req.params.id;
    try {
      const checkOrderID = await Order.findById(orderID);
      if (!checkOrderID) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy sản phẩm order" });
      }

      const allowCancel = ["Chưa Xác Nhận", "Đã Xác Nhận"];
      if (allowCancel.includes(checkOrderID.orderStatus.toString())) {
        await Order.findByIdAndDelete(orderID);
        return res
          .status(200)
          .json({ success: true, message: "Hủy đơn hàng thành công" });
      } else {
        return res.status(200).json({
          success: false,
          message: `Đơn hàng đang ở trạng thái ${checkOrderID.orderStatus} không thể hủy`,
        });
      }

      // if (
      //   checkOrderID.orderStatus.toString() === "Đã xác nhận" ||
      //   "Đang Giao" ||
      //   "Hoàn Thành"
      // ) {
      //   return res.status(200).json({
      //     success: true,
      //     message: "Đơn hàng của bạn đã được xác nhận không thể hủy",
      //   });
      // } else {
      //   await Order.findByIdAndDelete(orderID);
      //   return res
      //     .status(200)
      //     .json({ success: true, message: "Hủy order thành công" });
      // }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Error" });
    }
  },
};

module.exports = orderControllers;
