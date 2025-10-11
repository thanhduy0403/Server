const Cart = require("../../model/cart");
const product = require("../../model/product");
const Product = require("../../model/product");
const cartControllers = {
  // addCart: async (req, res) => {
  //   const productID = req.params.id;
  //   const { quantity } = req.body;
  //   const checkProductID = await Product.findById(productID);
  //   try {
  //     if (!checkProductID) {
  //       return res
  //         .status(403)
  //         .json({ success: false, message: "Không tìm thấy sản phẩm" });
  //     }

  //     if (quantity > checkProductID.amount) {
  //       return res.status(200).json({
  //         success: true,
  //         message: "Sản phẩm thêm vượt quá giới hạn",
  //       });
  //     }

  //     // kiểm tra nếu đã có sản phẩm trong giỏ hàng thì chỉ cần tăng số lượng  sản phẩm lên với điều kiện
  //     // id product gửi từ params phải trùng và token của người dùng phải là chính họ

  //     const checkQuantityCart = await Cart.findOne({
  //       userInfo: req.user.id,
  //       product: productID,
  //     });
  //     // nếu có thì tăng số lượng sản phẩm lên
  //     //checkQuantityCart.quantity số lượng sản phẩm ban đầu
  //     //quantity; sl sản phẩm thêm lần sau "case trùng id sản phẩm"
  //     if (checkQuantityCart) {
  //       checkQuantityCart.quantity += quantity;
  //       // nếu lần 2 thêm sản phẩm nhưng tổng sản phẩm các lần cộng lại lớn hơn số lượng trong trong kho
  //       // thì báo thêm sản phẩm quá giới hạn
  //       if (checkQuantityCart.quantity > checkProductID.amount) {
  //         return res.status(400).json({
  //           success: false,
  //           message: "Sản phẩm thêm vượt quá giới hạn",
  //         });
  //       } else {
  //         await checkQuantityCart.save();
  //         return res.status(200).json({
  //           success: true,
  //           message: "Thêm sản phẩm thành công",
  //           productName: checkProductID.name,
  //         });
  //       }
  //     } else {
  //       const addToCart = new Cart({
  //         userInfo: req.user.id,
  //         product: productID,
  //         quantity: quantity,
  //       });

  //       await addToCart.save();
  //       return res.status(200).json({
  //         success: true,
  //         message: "Thêm vào giỏ hàng thành công",
  //         productName: checkProductID.name,
  //         quantity: quantity,
  //       });
  //     }
  //   } catch (error) {
  //     console.log(error);
  //     return res.status(500).json({ success: false, message: "Error" });
  //   }
  // },

  //   addCartSize: async (req, res) => {
  //   const productID = req.params.id;
  //   const { quantity, size } = req.body;

  //   try {
  //     // Kiểm tra tồn tại sản phẩm
  //     const product = await Product.findById(productID);
  //     if (!product) {
  //       return res
  //         .status(404)
  //         .json({ success: false, message: "Không tìm thấy sản phẩm" });
  //     }

  //     // Kiểm tra size tồn tại không
  //     if (!product.sizes.has(size)) {
  //       return res.status(400).json({
  //         success: false,
  //         message: `Size ${size} không tồn tại cho sản phẩm này`,
  //       });
  //     }

  //     const availableStock = product.sizes.get(size);

  //     // Kiểm tra đủ hàng
  //     if (quantity > availableStock) {
  //       return res.status(400).json({
  //         success: false,
  //         message: `Không đủ hàng cho size ${size}. Hiện còn ${availableStock} sản phẩm.`,
  //       });
  //     }

  //     // Tìm giỏ hàng
  //     let cart = await Cart.findOne({ userInfo: req.user.id });

  //     if (cart) {
  //       // Tìm sản phẩm cùng ID và cùng size
  //       const productIndex = cart.products.findIndex(
  //         (item) =>
  //           item.product.toString() === productID && item.size === size
  //       );

  //       if (productIndex > -1) {
  //         // Nếu đã có thì cộng dồn quantity
  //         const newQuantity =
  //           cart.products[productIndex].quantity + quantity;

  //         if (newQuantity > availableStock) {
  //           return res.status(400).json({
  //             success: false,
  //             message: `Sản phẩm size ${size} trong giỏ vượt quá số lượng trong kho.`,
  //           });
  //         }

  //         cart.products[productIndex].quantity = newQuantity;
  //       } else {
  //         // Nếu chưa có, thêm mới vào giỏ
  //         cart.products.push({ product: productID, quantity, size });
  //       }

  //       await cart.save();
  //       return res.status(200).json({
  //         success: true,
  //         message: "Thêm sản phẩm vào giỏ hàng thành công",
  //       });
  //     } else {
  //       // Chưa có giỏ hàng → tạo mới
  //       cart = new Cart({
  //         userInfo: req.user.id,
  //         products: [{ product: productID, quantity, size }],
  //       });

  //       await cart.save();
  //       return res.status(200).json({
  //         success: true,
  //         message: "Tạo giỏ hàng mới và thêm sản phẩm thành công",
  //       });
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     return res.status(500).json({ success: false, message: "Lỗi server" });
  //   }
  // },

  addCart: async (req, res) => {
    const productID = req.params.id;
    const { quantity, size } = req.body;

    try {
      const checkProductID = await Product.findById(productID);
      if (!checkProductID) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sản phẩm",
        });
      }

      let sizeInfo = null;

      // Nếu sản phẩm có size
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
            message: `Size ${size} không tồn tại cho sản phẩm này`,
          });
        }

        if (quantity > sizeInfo.quantity) {
          return res.status(400).json({
            success: false,
            message: `Không đủ hàng cho size ${size}. Hiện còn ${sizeInfo.quantity} sản phẩm.`,
          });
        }
      } else {
        // Nếu sản phẩm không có size
        if (quantity > checkProductID.stock) {
          return res.status(400).json({
            success: false,
            message: `Không đủ hàng. Hiện còn ${checkProductID.stock} sản phẩm.`,
          });
        }
      }

      // Tìm giỏ hàng
      let cart = await Cart.findOne({ userInfo: req.user.id });

      if (cart) {
        const productIndex = cart.products.findIndex(
          (product) =>
            product.product.toString() === productID &&
            (checkProductID.sizes.length > 0
              ? product.size === size
              : !product.size)
        );

        if (productIndex > -1) {
          const newQuantity = cart.products[productIndex].quantity + quantity;

          if (checkProductID.sizes.length > 0) {
            if (newQuantity > sizeInfo.quantity) {
              return res.status(400).json({
                success: false,
                message: `Sản phẩm size ${size} trong giỏ vượt quá số lượng trong kho.`,
              });
            }
          } else {
            if (newQuantity > checkProductID.stock) {
              return res.status(400).json({
                success: false,
                message: `Sản phẩm trong giỏ vượt quá số lượng trong kho.`,
              });
            }
          }

          cart.products[productIndex].quantity = newQuantity;
        } else {
          cart.products.push({
            product: productID,
            quantity,
            size: checkProductID.sizes.length > 0 ? size : null,
          });
        }

        await cart.save();
        return res.status(200).json({
          success: true,
          message: "Thêm sản phẩm vào giỏ hàng thành công",
        });
      } else {
        cart = new Cart({
          userInfo: req.user.id,
          products: [
            {
              product: productID,
              quantity,
              size: checkProductID.sizes.length > 0 ? size : null,
            },
          ],
        });

        await cart.save();
        return res.status(200).json({
          success: true,
          message: "Tạo giỏ hàng mới và thêm sản phẩm thành công",
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  // get all cart user
  getAll: async (req, res) => {
    try {
      const getList = await Cart.find();
      if (!getList) {
        return res.status(403).json({
          success: false,
          message: "Danh sách giỏ hảng người dùng không có ",
          data: [],
        });
      }
      return res.json(getList);
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error" });
    }
  },

  // get createBy
  // get createBy
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
      s;
    }
  },

  updateCart: async (req, res) => {
    const productID = req.params.id;
    const { quantity, size } = req.body;

    try {
      // Kiểm tra sản phẩm tồn tại
      const checkProductID = await Product.findById(productID);
      if (!checkProductID) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sản phẩm",
        });
      }

      let sizeInfo = null;
      if (checkProductID.sizes && checkProductID.sizes.length > 0) {
        if (!size) {
          return res.status(400).json({
            success: false,
            message: "Vui lòng chọn size cho sản phẩm",
          });
        }

        sizeInfo = checkProductID.sizes.find((s) => s.size === size);
        if (!sizeInfo) {
          return res.status(400).json({
            success: false,
            message: `Size ${size} không tồn tại cho sản phẩm này`,
          });
        }

        if (quantity > sizeInfo.quantity) {
          return res.status(400).json({
            success: false,
            message: `Số lượng vượt quá kho cho size ${size}. Hiện còn ${sizeInfo.quantity} sản phẩm`,
          });
        }
      } else {
        if (quantity > checkProductID.stock) {
          return res.status(400).json({
            success: false,
            message: `Số lượng vượt quá kho. Hiện còn ${checkProductID.stock} sản phẩm`,
          });
        }
      }

      // Tìm giỏ hàng của user
      const cart = await Cart.findOne({ userInfo: req.user.id });
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giỏ hàng",
        });
      }

      // Tìm sản phẩm trong giỏ
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

      // Update số lượng
      cart.products[productIndex].quantity = quantity;
      await cart.save();

      return res.status(200).json({
        success: true,
        message: "Cập nhật số lượng sản phẩm thành công",
        newCart: cart,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
        error,
      });
    }
  },

  deleteItemCart: async (req, res) => {
    const productID = req.params.id;
    const { size } = req.body;
    try {
      // Tìm giỏ hàng của người dùng
      const cart = await Cart.findOne({ userInfo: req.user.id });
      if (!cart) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy giỏ hàng" });
      }

      // Tìm sản phẩm trong giỏ hàng
      const productIndex = cart.products.findIndex(
        (item) => item.product.toString() === productID && item.size === size
      );
      if (productIndex === -1) {
        console.log(productIndex);
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy sản phẩm" });
      }

      // Xóa sản phẩm khỏi giỏ hàng
      cart.products.splice(productIndex, 1);
      await cart.save();

      // Nếu giỏ hàng trống, có thể xóa luôn giỏ hàng
      if (cart.products.length === 0) {
        await Cart.findByIdAndDelete(cart._id);
      }

      return res.status(200).json({
        success: true,
        message: "Xóa sản phẩm trong giỏ hàng thành công",
        deletedItem: { productID, size },
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Lỗi server", error });
    }
  },
};

module.exports = cartControllers;
