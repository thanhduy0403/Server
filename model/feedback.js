const mongoose = require("mongoose");
const feedbackSchema = mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    productID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 2000 },
    // do sản phẩm có size để phân loại size cho từng sản phẩm để feedback
    size: {
      type: String,
    },
  },
  { timestamps: true }
);
feedbackSchema.index(
  { orderID: 1, userID: 1, productID: 1, size: 1 },
  { unique: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
