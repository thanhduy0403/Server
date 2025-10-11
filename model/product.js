const mongoose = require("mongoose");
const mongooseLeanVirtuals = require("mongoose-lean-virtuals");
const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  gallery: [{ type: String }],
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  stock: {
    type: Number,
    // required: true,
  },
  discount: {
    type: Number,
  },
  soldCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isDelete: {
    type: Boolean,
    default: false,
  },
  sizes: [
    {
      size: String,
      quantity: Number,
    },
  ],

  categoryID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
});
productSchema.virtual("amount").get(function () {
  if (!Array.isArray(this.sizes)) return 0;
  return this.sizes.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );
});
productSchema.virtual("discountedPrice").get(function () {
  return (this.price * (100 - this.discount)) / 100;
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

productSchema.plugin(mongooseLeanVirtuals);

module.exports = mongoose.model("Product", productSchema);
