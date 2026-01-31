const Banner = require("../../model/Banner");

const bannerControllers = {
  getAllBanner: async (req, res) => {
    const now = new Date();
    try {
      const getList = await Banner.find({
        isActive: true,
        endDate: { $gte: now },
      }).populate("products");
      if (!getList || getList.length === 0) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy banner" });
      }
      if (getList.endDate < now) {
        getList.isActive = false;
      }
      return res
        .status(200)
        .json({ success: true, message: "Danh sách bannner", data: getList });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
  getDetailBanner: async (req, res) => {
    const bannerID = req.params.id;
    try {
      const checkBanner = await Banner.findById(bannerID).populate("products");
      if (!checkBanner) {
        return res.status(403).json({
          success: false,
          message: "Không tìm thấy banner",
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
          checkBanner,
          type: "multiple",
          products: checkBanner.products,
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },
};

module.exports = bannerControllers;
