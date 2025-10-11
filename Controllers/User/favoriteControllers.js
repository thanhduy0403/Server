const Favorite = require("../../model/favorite");
const Product = require("../../model/product");
const { getCreateByUser } = require("../Admin/orderController");

const favoriteController = {
  addToFavorite: async (req, res) => {
    const productID = req.params.id;
    try {
      const checkProductID = await Product.findById(productID);
      if (!checkProductID) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy sản phẩm" });
      }
      let favorite = await Favorite.findOne({ userInfo: req.user.id });
      // người dùng đã có danh sách yêu thích trước đó
      if (favorite) {
        const alreadyExit = favorite.products.some(
          (item) => item.productID.toString() === productID
        );
        if (alreadyExit) {
          return res.status(200).json({
            success: false,
            message: "Sản phẩm đã có trong danh sách yêu thích",
          });
        } else {
          favorite.products.push({
            productID,
          });
        }
        await favorite.save();
        return res.status(200).json({
          success: true,
          message: "Thêm sản phẩm yêu thích thành công",
          favorite,
        });
      } else {
        favorite = new Favorite({
          userInfo: req.user.id,
          products: [{ productID }],
        });
      }
      await favorite.save();
      return res.status(200).json({
        success: true,
        message: "Đã sản phẩm vào danh mục yêu thích",
        favorite,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Error",
      });
    }
  },
  getCreateByUser: async (req, res) => {
    try {
      const favorite = await Favorite.findOne({
        userInfo: req.user.id,
      }).populate({
        path: "products.productID", // populate productID
        populate: { path: "categoryID", select: "name" }, // populate luôn categoryID trong productID
      });

      if (!favorite) {
        return res.status(200).json({
          message: "Chưa có sản phẩm yêu thích",
          data: null,
        });
      }

      res.status(200).json({
        message: "Danh sách yêu thích",
        data: favorite, // trả full favorite với productID đã populate
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },
  deleteItemFavorite: async (req, res) => {
    const productID = req.params.id;
    try {
      const favorite = await Favorite.findOne({ userInfo: req.user.id });
      if (!favorite) {
        return res.status(403).json({
          success: false,
          message: "Không tìm thấy danh mục yêu thích",
        });
      }
      const productIndex = favorite.products.findIndex(
        (p) => p.productID.toString() === productID
      );
      if (!productIndex === 0) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy sản phẩm" });
      }
      favorite.products.splice(productIndex, 1);
      await favorite.save();
      return res
        .status(200)
        .json({ success: true, message: "Xóa sản phẩm thành công" });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error" });
    }
  },
};

module.exports = favoriteController;
