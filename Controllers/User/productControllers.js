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
};

module.exports = productControllers;
