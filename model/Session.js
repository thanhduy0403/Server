const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const sessionSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  refreshToken: {
    type: String,
    require: true,
  },
  expiresAt: {
    type: Date,
    require: true,
  },
});
// tự động xóa khi hết hạn
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.model("Session", sessionSchema);
