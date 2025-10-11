const Category = require("../../model/category");

const categoryControllers = {
  getCategory: async (req, res) => {
    try {
      const getAll = await Category.find().populate({
        path: "products",
      });
      if (!getAll) {
        return res.status(403).json({
          success: false,
          message: "Không tìm thấy danh sách category",
        });
      }
      let totalProduct = 0;
      const categories = getAll.map((category) => {
        const productCount = category.products.length;
        totalProduct += productCount;
        return {
          ...category._doc,
          productCount,
        };
      });
      return res.status(200).json({
        success: true,
        message: "Danh sách category",
        categories,
        totalProduct,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Error",
      });
    }
  },
  getDetailCategory: async (req, res) => {
    const categoryID = req.params.id;
    try {
      const getDetail = await Category.findById(categoryID).populate(
        "products"
      );
      if (!getDetail) {
        return res.status(403).json({
          success: false,
          message: "Không tìm thấy danh mục sản phẩm",
        });
      }
      let totalProduct = 0;
      const productCount = getDetail.products.length;
      totalProduct += productCount;

      return res.status(200).json({
        success: true,
        message: "Chi tiết danh mục sản phẩm",
        category: {
          ...getDetail._doc,
          totalProduct,
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Error" });
    }
  },
};

module.exports = categoryControllers;
