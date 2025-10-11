const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
  },
  soldCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
});
module.exports = mongoose.model("Category", categorySchema);
