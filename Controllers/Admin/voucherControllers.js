const Voucher = require("../../model/Voucher");

const voucherControllers = {
  postVoucher: async (req, res) => {
    const {
      code,
      discountValue,
      minOrderValue,
      maxDiscount,
      expiryDate,
      quantity,
    } = req.body;
    try {
      if (!code || !discountValue || !expiryDate || !quantity) {
        return res
          .status(403)
          .json({ success: false, message: "Hãy điền đủ thông tin" });
      }
      const createVoucher = new Voucher({
        code: code,
        discountValue: discountValue,
        minOrderValue: minOrderValue,
        maxDiscount: maxDiscount,
        expiryDate: expiryDate,
        quantity: quantity,
      });
      await createVoucher.save();
      return res.status(200).json({
        success: true,
        message: "Tạo voucher thành công",
        createVoucher,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Error" });
    }
  },
  getListVoucher: async (req, res) => {
    try {
      const getList = await Voucher.find();
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
        message: "error",
      });
    }
  },
  updateVoucher: async (req, res) => {
    const voucherID = req.params.id;
    try {
      const {
        code,
        discountValue,
        minOrderValue,
        maxDiscount,
        expiryDate,
        quantity,
      } = req.body;
      const checkVoucherID = await Voucher.findById(voucherID);
      if (!checkVoucherID) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy voucher" });
      }
      const newVoucher = await Voucher.findByIdAndUpdate(voucherID, {
        code: code,
        discountValue: discountValue,
        minOrderValue: minOrderValue,
        maxDiscount: maxDiscount,
        expiryDate: expiryDate,
        quantity: quantity,
      });
      await newVoucher.save();
      return res
        .status(200)
        .json({ success: true, message: "Cập nhật thành công" });
    } catch (error) {
      return res
        .status(403)
        .json({ success: false, message: "Không tìm thấy voucher" });
    }
  },
  deleteVoucher: async (req, res) => {
    const voucherID = req.params.id;
    try {
      const checkVoucherID = await Voucher.findById(voucherID);
      if (!checkVoucherID) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy voucher" });
      }
      await Voucher.findByIdAndDelete(voucherID);
      return res
        .status(200)
        .json({ success: true, message: "Xóa voucher thành công" });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error" });
    }
  },
};

module.exports = voucherControllers;
