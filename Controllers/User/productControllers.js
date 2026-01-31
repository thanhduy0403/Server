const Product = require("../../model/product");

const productControllers = {
  getListProducts: async (req, res) => {
    const getList = await Product.find().populate("categoryID", "name");
    try {
      if (!getList) {
        return res
          .status(403)
          .json({ success: false, message: "Xem thất bại" });
      }
      console.log(getList);
      return res.status(200).json({
        success: true,
        message: "Danh sách sản phẩm",
        products: getList,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error" });
    }
  },

  getDetailProduct: async (req, res) => {
    const idProduct = req.params.id;
    try {
      const getOne = await Product.findById(idProduct).populate(
        "categoryID",
        "name"
      );
      if (!getOne) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy sản phẩm" });
      }
      return res
        .status(200)
        .json({ success: true, message: "Chi tiết sản phẩm", product: getOne });
    } catch (error) {
      return res.status(500).json({ success: "false", message: "Error" });
    }
  },
  getProductRelated: async (req, res) => {
    const productID = req.params.id;
    try {
      // lấy sản phẩm hiện tại
      const product = await Product.findById(productID);
      if (!product) {
        return res.status(403).json({
          success: false,
          message: "Không tìm thấy sản phẩm",
        });
      }
      const productRelated = await Product.find({
        productType: product.productType, // lấy theo loại product
        _id: { $ne: productID }, // loại bỏ sản phẩm chính
      })
        .limit(4) // lấy giới hạn 4 sản phẩm
        .lean({ virtuals: true }); // lấy virtuals (amount, discountedPrice)
      return res.status(200).json({
        success: true,
        message: "Sản phẩm cùng loại",
        related: productRelated,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },
};

module.exports = productControllers;
