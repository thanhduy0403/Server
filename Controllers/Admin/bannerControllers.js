const Banner = require("../../model/Banner");
const Product = require("../../model/product");
const bannerControllers = {
  createBanner: async (req, res) => {
    const { title, products, startDate, endDate } = req.body;
    try {
      if (!title || !products) {
        console.log("gửi data", req.body);
        return res
          .status(403)
          .json({ success: false, message: "Hãy điền đầy đủ thông tin" });
      }
      if (!req.file) {
        return res
          .status(403)
          .json({ success: false, message: "Hãy tải hình ảnh banner" });
      }
      const imageBanner = req.file.path;
      let productIDs;
      try {
        productIDs = Array.isArray(products) ? products : JSON.parse(products);
      } catch (e) {
        productIDs = [products];
      }

      const checkProduct = await Product.find({ _id: { $in: productIDs } });
      if (checkProduct.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Không tìm thấy sản phẩm" });
      }
      const newBanner = new Banner({
        title: title,
        image: imageBanner,
        products: productIDs,
        startDate: startDate,
        endDate: endDate,
      });
      await newBanner.save();
      return res.status(200).json({
        success: true,
        message: "Tạo banner thành công",
        data: newBanner,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  getAllBanner: async (req, res) => {
    const now = new Date();
    try {
      let getList = await Banner.find().populate("products");
      if (!getList || getList.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Danh sách bannner trống",
        });
      }
      for (let banner of getList) {
        if (
          banner.endDate &&
          banner.endDate < now &&
          banner.isActive === true
        ) {
          await Banner.findByIdAndUpdate(banner._id, { isActive: false });
        }
      }
      getList = await Banner.find().populate("products");

      return res.status(200).json({
        success: true,
        message: "Danh sách banner",
        data: getList,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },
  getDetailBanner: async (req, res) => {
    const bannerID = req.params.id;
    try {
      const checkBanner = await Banner.findById(bannerID).populate("products");
      if (!checkBanner) {
        return res.status(403).json({
          success: false,
          message: "không tìm thấy banner",
        });
      }
      if (checkBanner.products.length === 1) {
        return res.status(200).json({
          success: true,
          type: "single",
          product: checkBanner.products[0],
        });
      } else {
        return res.status(200).json({
          success: true,
          type: "multiple",
          products: checkBanner.products,
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "không tìm thấy banner",
      });
    }
  },

  updateBanner: async (req, res) => {
    const bannerID = req.params.id;
    const { title, products, startDate, endDate } = req.body;
    console.log(req.body);
    try {
      if (!title || !products) {
        return res
          .status(403)
          .json({ success: false, message: "Hãy điền đầy đủ thông tin" });
      }
      const checkBanner = await Banner.findById(bannerID);
      if (!checkBanner) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy banner" });
      }
      let productIDs;
      try {
        productIDs = Array.isArray(products) ? products : JSON.parse(products);
      } catch (e) {
        productIDs = [products];
      }
      const imageBanner = req.file?.path || checkBanner.image;
      const now = new Date();
      const isActive = endDate && new Date(endDate) > now;
      const updateData = await Banner.findByIdAndUpdate(
        bannerID,
        {
          title: title,
          image: imageBanner,
          products: productIDs,
          startDate: startDate,
          endDate: endDate,
          isActive,
        },
        { new: true }
      );
      await updateData.save();
      return res.status(200).json({
        success: true,
        message: "Cập nhật thành công",
        data: updateData,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
  deleteBanner: async (req, res) => {
    const bannerID = req.params.id;
    try {
      const checkBanner = await Banner.findById(bannerID);
      if (!checkBanner) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy banner" });
      }
      await Banner.findByIdAndDelete(bannerID);
      return res
        .status(200)
        .json({ success: true, message: "Xóa thành công banner" });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
};

module.exports = bannerControllers;
