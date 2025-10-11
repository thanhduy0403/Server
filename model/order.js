const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  userInfo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  cartID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart",
    required: true,
  },
  products: [
    {
      quantity: { type: Number, required: true },
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      price: {
        type: Number,
        require: true,
      },
      nameSnapshot: {
        type: String,
        require: true,
      },
      size: {
        type: String,
        require: true,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  confirmedAt: Date,
  address: {
    province: { type: String }, // Tỉnh/Thành phố
    district: { type: String }, // Quận/Huyện
    ward: { type: String }, // Phường/Xã
    street: { type: String }, // Địa chỉ cụ thể
  },
  username_Receive: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  note: {
    type: String,
  },
  deletedAt: {
    type: Date,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  orderStatus: {
    type: String,
    enum: ["Chưa Xác Nhận", "Đã Xác Nhận", "Đang Giao", "Hoàn Thành", "Đã Hủy"],
    default: "Chưa Xác Nhận",
  },
  expectedDeliveryAt: {
    type: Date,
  },
  paymentStatus: {
    type: String,
    enum: ["Thanh Toán Khi Nhận Hàng", "Thanh Toán Online", "Thất Bại"],
  },
  totalPriceProduct: { type: Number, required: true },
  // các trường liên quan voucher
  discountAmount: { type: Number, default: 0 },
  finalPrice: { type: Number, required: true },
  voucherApplied: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Voucher",
    default: null,
  },
});

module.exports = mongoose.model("Order", orderSchema);
