const Voucher = require("../../model/Voucher");

const voucherControllers = {
  getListVoucher: async (req, res) => {
    const getList = await Voucher.find();
    try {
      if (!getList || getList.length === 0) {
        return res.status(200).json({
          success: true,
          message: "Danh sách voucher trống",
          data: [],
        });
      }
      return res
        .status(200)
        .json({ success: true, message: "Danh sách voucher", data: getList });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error",
      });
    }
  },
};

module.exports = voucherControllers;
