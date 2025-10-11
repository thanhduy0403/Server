const Cart = require("../../model/cart");
const Product = require("../../model/product");

const cartControllers = {
  addCart: async (req, res) => {
    const productID = req.params.id;
    const { quantity, size } = req.body;
    try {
      const checkProductID = await Product.findById(productID);
      if (!checkProductID) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy sản phẩm" });
      }
      let sizeInfo = null;
      // nếu sản phẩm có size
      if (checkProductID.sizes && checkProductID.sizes.length > 0) {
        if (!size) {
          return res.status(400).json({
            success: false,
            message: "Vui lòng chọn size cho sản phẩm",
          });
        }
        sizeInfo = checkProductID.sizes.find((item) => item.size === size);
        if (!sizeInfo) {
          return res.status(400).json({
            success: false,
            message: "Sản phẩm này không tồn tại size",
          });
        }
        // nếu thêm số lượng nhiều hơn trong kho (đối với sản phẩm có size)
        // sizeInfo.quantity là số lượng sản phẩm của từng size
        if (quantity > sizeInfo.quantity) {
          return res
            .status(400)
            .json({ success: false, message: "Số lượng vượt quá kho" });
        }
      }
      // nếu sản phẩm không có size chỉ thêm vào và kiểm tra stock
      else {
        if (quantity > checkProductID.stock) {
          return res.status(400).json({
            success: false,
            message: "Số lượng vượt quá trong kho",
          });
        }
      }
      let cart = await Cart.findOne({ userInfo: req.user.id });
      // nếu giỏ hàng đã tồn tại
      // sản phẩm đã có trong giỏ hàng
      if (cart) {
        // tìm kiếm xem có sản phẩm trong đó chưa
        const productIndex = cart.products.findIndex(
          (product) =>
            product.product.toString() === productID &&
            (checkProductID.sizes.length > 0
              ? product.size === size
              : !product.size)
        );
        if (productIndex > -1) {
          // đã có sản phẩm tồn tại mà vẫn muốn thêm ở ngoài chi tiết sản phẩm
          const newQuantity = cart.products[productIndex].quantity + quantity;
          // sản phẩm đã có trước trong giỏ và có size
          if (checkProductID.sizes.length > 0) {
            if (newQuantity > sizeInfo.amount) {
              return res.status(400).json({
                success: false,
                message: "Sản phẩm thêm vượt quá trong kho",
              });
            }
          }
          // sản phẩm đã có trong giỏ nhưng không có size
          else {
            if (newQuantity > checkProductID.stock) {
              return res.status(400).json({
                success: false,
                message: "Sản phẩm thêm vượt quá trong kho",
              });
            }
          }
          // cập nhật lại số lượng sau khi thêm (đã có sản phẩm trong giỏ hàng)
          cart.products[productIndex].quantity = newQuantity;
        }
        // đã có giỏ hàng nhưng  sản phẩm đó (theo productID và size) chưa có trong giỏ.
        else {
          cart.products.push({
            product: productID,
            size: checkProductID.sizes.length > 0 ? size : null,
            quantity,
          });
        }
        // lưu giỏ hàng
        await cart.save();
        return res.status(200).json({
          success: true,
          message: "Thêm sản vào giỏ hàng thành công",
        });
      }
      // chưa có giỏ hàng
      else {
        cart = new Cart({
          userInfo: req.user.id,
          products: [
            {
              product: productID,
              size: checkProductID.sizes.length > 0 ? size : null,
              quantity,
            },
          ],
        });
      }
      await cart.save();
      return res.status(200).json({
        success: true,
        message: "Tạo giỏ hàng mới và thêm sản phẩm thành công",
      });
    } catch (error) {
      return res.status(500).json({
        success: true,
        message: "Lỗi server",
      });
    }
  },

  // get createBy
  // getCart: async (req, res) => {
  //   const userID = req.user.id;
  //   try {
  //     const getCreateBy = await Cart.find({ userInfo: userID }).populate({
  //       path: "userInfo product",
  //       select: "username  name description amount price discount",
  //     });
  //     if (getCreateBy.length === 0) {
  //       return res.status(200).json({
  //         success: true,
  //         message: "Chưa có sản phẩm nào trong giỏ hàng",
  //       });
  //     }

  //     let totalPriceProducts = 0;
  //     const cartWithTotalPrice = getCreateBy.map((item) => {
  //       const totalPrice = item.quantity * item.product.discountedPrice; // tổng tiền riêng từng sản phẩm
  //       totalPriceProducts += totalPrice; // tổng tiền tất cả sản phẩm
  //       return { ...item._doc, totalPrice }; // thêm totalPrice vào mỗi sản phẩm trong giỏ
  //     });
  //     return res.status(200).json({
  //       success: "true",
  //       message: "Các sản phẩm trong giỏ hàng",
  //       getCreateBy: cartWithTotalPrice,
  //       totalPriceProducts,
  //     });
  //   } catch (error) {
  //     return res.status(500).json({ success: false, message: "Error" });
  //   }
  // },
  getCart: async (req, res) => {
    const cartID = req.user.id;
    try {
      const getCreateBy = await Cart.findOne({ userInfo: cartID }).populate({
        path: "products.product",
        select: "-createBy -updateBy -categoryID",
      });
      if (!getCreateBy || getCreateBy.products.length === 0) {
        return res.status(200).json({
          success: true,
          message: "Chưa có sản phẩm nào trong giỏ hàng",
          cart: [],
          totalPriceProducts: 0,
        });
      }

      let totalPriceProducts = 0;
      // Lọc bỏ các item không có product (có thể do sản phẩm đã bị xóa)
      const cartWithTotalPrice = getCreateBy.products
        .filter((item) => item.product) // chỉ lấy item có product
        .map((item) => {
          const product = item.product;
          const totalPrice =
            item.quantity * (product.discountedPrice || product.price || 0);
          totalPriceProducts += totalPrice;
          return { ...item._doc, totalPrice };
        });

      return res.json({
        cartID: getCreateBy._id,
        cartWithTotalPrice,
        totalPriceProducts,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Error",
      });
    }
  },

  updateCart: async (req, res) => {
    const productID = req.params.id;
    const { quantity, size } = req.body;
    try {
      const checkProductID = await Product.findById(productID);
      // check sản phẩm có size
      if (checkProductID.sizes.length > 0) {
        let sizeInfo = checkProductID.sizes.find((s) => s.size === size);
        if (!sizeInfo) {
          return res
            .status(404)
            .json({ success: false, message: "Size không tồn tại" });
        }
        if (quantity > sizeInfo.quantity) {
          return res.status(403).json({
            success: false,
            message: "Số lượng size không đủ cho size phẩm",
          });
        }
        // check sản phẩm không có size
      } else {
        if (quantity > checkProductID.stock) {
          return res.status(403).json({
            success: false,
            message: "Sản phẩm không đủ số lượng",
          });
        }
      }

      const cart = await Cart.findOne({ userInfo: req.user.id });
      if (!cart) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy giỏ hàng" });
      }
      // tìm sản phẩm trong giỏ hàng
      const productIndex = cart.products.findIndex(
        (p) =>
          p.product.toString() === productID &&
          (checkProductID.sizes.length > 0 ? p.size === size : !p.size)
      );
      if (productIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sản phẩm trong giỏ hàng",
        });
      }
      cart.products[productIndex].quantity = quantity;
      await cart.save();
      return res
        .status(200)
        .json({ success: true, message: "Cập nhật thành công", newCart: cart });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  deleteItem: async (req, res) => {
    const productID = req.params.id;
    const { size } = req.body;
    try {
      const cart = await Cart.findOne({ userInfo: req.user.id });
      if (!cart) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy giỏ hàng" });
      }
      const productIndex = cart.products.findIndex(
        (p) => p.product.toString() === productID && p.size === size
      );
      if (productIndex === -1) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy sản phẩm" });
      }
      cart.products.splice(productIndex, 1);
      await cart.save();
      if (cart.products.length === 0) {
        await Cart.findByIdAndDelete(cart._id);
      }
      return res.status(200).json({
        success: true,
        message: "Xóa sản phẩm khỏi giỏ hàng thành công",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error",
      });
    }
  },
};

module.exports = cartControllers;
