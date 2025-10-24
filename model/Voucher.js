const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const voucherSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true, // Mỗi voucher chỉ có một mã duy nhất
      trim: true,
    },
    discountValue: {
      type: Number,
      required: true, // % giảm (vd: 5, 10, 20)
      min: 1,
      max: 100,
    },
    minOrderValue: {
      type: Number,
      default: 0, // Giá trị đơn hàng tối thiểu để áp dụng
    },
    maxDiscount: {
      type: Number,
      default: null, // Giảm tối đa bao nhiêu tiền
    },
    expiryDate: {
      type: Date,
      required: true, // ngày hết hạn của voucher
    },
    quantity: {
      type: Number,
      required: true,
      min: 1, // số lượng tối thiểu giảm
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Voucher", voucherSchema);
