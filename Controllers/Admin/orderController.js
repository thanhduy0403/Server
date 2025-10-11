const Cart = require("../../model/cart");
const Category = require("../../model/category");
const Order = require("../../model/order");
const Product = require("../../model/product");
const orderController = {
  createOder: async (req, res) => {
    const cartID = req.params.id;
    const { address, username_Receive, phoneNumber, paymentStatus } = req.body;
    const checkCartID = await Cart.findById(cartID).populate(
      "products.product"
    );
    if (!checkCartID || checkCartID.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Không tìm thấy giỏ hàng hoặc giỏ đang trống",
      });
    }
    try {
      if (!address || !username_Receive || !phoneNumber || !paymentStatus) {
        return res
          .status(401)
          .json({ success: false, message: "Vui lòng điền đầy đủ thông tin" });
      }
      // tính tổng tiền sản phẩm
      // let totalPriceProducts = 0;
      // for (const item of checkCartID.products) {
      //   totalPriceProducts += item.quantity * item.product.discountedPrice;
      // }
      const totalPrice = checkCartID.products.reduce((sum, item) => {
        return sum + item.quantity * item.product.discountedPrice;
      }, 0);

      const newOrder = new Order({
        userInfo: req.user.id,
        cartID: cartID,
        username_Receive: username_Receive,
        address: address,
        phoneNumber: phoneNumber,
        orderStatus: "Chưa Xác Nhận",
        paymentStatus: paymentStatus,
        products: checkCartID.products.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          size: item.size || null,
          stock: !item.size ? item.quantity : null,
          discount: item.product.discount,
          nameSnapshot: item.product.name,
          discountedPrice: item.product.discountedPrice,
          price: item.product.price,
        })),
        totalPriceProduct: totalPrice, //  Lưu tổng tiền vào order
      });

      console.log(newOrder);
      await newOrder.save();

      // giảm số lượng sản phẩm ở kho sau khi order thành công
      // sử dụng for of để lặp qua từng sản phẩm ở model cart
      for (const item of checkCartID.products) {
        const product = await Product.findById(item.product._id);
        // tránh trường hợp bị âm nếu order quá số lượng thì trả về 0
        //product.amount = Math.max(0, product.amount - item.quantity);
        if (product.sizes && product.sizes.length > 0 && item.size) {
          const sizeIndex = product.sizes.findIndex(
            (s) => s.size === item.size
          );
          if (sizeIndex !== -1) {
            // các size hiện tại còn trong kho
            const currentQuantity = product.sizes[sizeIndex].quantity || 0;
            // lấy size hiện tại trừ cho số lượng sản phẩm order item.quantity
            product.sizes[sizeIndex].quantity = Math.max(
              0,
              currentQuantity - item.quantity
            );
          }
        } else {
          product.stock = Math.max(0, (product.stock || 0) - item.quantity);
        }

        // cập nhật số lượng mua sản phẩm (product.soldCount || 0) + item.quantity dựa vào số lượng order sản phẩm
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
        // cập nhập lại số lượng sau khi thay order
        await product.save();
      }
      await Cart.findByIdAndDelete(cartID);
      return res.status(200).json({
        success: true,
        message: "Tạo đơn hàng thành công",
        data: newOrder,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Error" });
    }
  },

  // get list order user
  getList: async (req, res) => {
    try {
      const getListOder = await Order.find()
        .populate({
          path: "cartID",
          populate: [
            {
              path: "userInfo",
              select: "username",
            },
          ],
        })
        .populate({
          path: "products.product",
          select: "name price discount image ",
        });
      if (!getListOder) {
        return res.status(403).json({
          success: false,
          message: "Không có danh sách order",
          data: [],
        });
      }
      return res.status(200).json({
        success: true,
        message: "Danh sách order",
        orderList: getListOder,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,

        message: "Error",
      });
    }
  },

  // get create by
  getCreateByUser: async (req, res) => {
    const orderID = req.user.id;
    try {
      const getCreateBy = await Order.find({ userInfo: orderID })
        .populate({
          path: "cartID",
          //cartID là từ model Order
          // lấy từ cartID trong cartID có userInfo và product trong model Cart
          populate: [
            {
              path: "userInfo",
              select: "username expectedDeliveryAt",
            },
          ],
        })
        .populate({
          path: "products.product",
          select: "name price discount ",
        });
      console.log(getCreateBy);
      if (getCreateBy.length === 0) {
        return res.status(200).json({
          success: true,
          message: "Chưa có sản phẩm nào trong danh sách order",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Danh sách order",
        orderList: getCreateBy,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Error" });
    }
  },

  confirm_Order: async (req, res) => {
    const orderID = req.params.id;
    const { orderStatus, paymentStatus } = req.body;
    try {
      const checkOrderID = await Order.findById(orderID);
      if (!checkOrderID) {
        return res
          .status(400)
          .json({ success: false, message: "Không tìm thấy đơn hàng" });
      }
      let expectedDeliveryAt = checkOrderID.expectedDeliveryAt;
      if (orderStatus === "Đã Xác Nhận" && !expectedDeliveryAt) {
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 3);
        expectedDeliveryAt = deliveryDate;
      }

      const confirmOrderStatus = await Order.findByIdAndUpdate(
        orderID,
        {
          orderStatus: orderStatus,
          paymentStatus: paymentStatus,
          expectedDeliveryAt,
        },
        { new: true }
      );
      console.log(expectedDeliveryAt);
      await confirmOrderStatus.save();
      return res.status(200).json({
        success: true,
        message: "Cập nhật thành công",
        confirmOrderStatus,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error" });
    }
  },

  cancel_Order: async (req, res) => {
    const orderID = req.params.id;
    try {
      const checkOrder = await Order.findById(orderID);
      if (!checkOrder) {
        return res
          .status(403)
          .json({ success: false, message: "Không tồn tại sản phẩm Order" });
      }
      checkOrder.deletedAt = new Date();
      checkOrder.isDeleted = true;
      checkOrder.orderStatus = "Đã Hủy";
      checkOrder.paymentStatus = "Thất Bại";
      await checkOrder.save();
      return res
        .status(200)
        .json({ success: true, message: "Hủy order thành công" });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error" });
    }
  },
};

module.exports = orderController;
