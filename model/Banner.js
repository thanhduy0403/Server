const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BannerSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  isActive: {
    type: Boolean,
    default: true,
  },
  startDate: Date,
  endDate: Date,
});

module.exports = mongoose.model("Banner", BannerSchema);
