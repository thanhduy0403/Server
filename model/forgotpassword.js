const mongoose = require("mongoose");
const crypto = require("crypto");

const passwordResetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  resetOTP: String,
  resetOTPExpires: Date,
  resetVerified: { type: Boolean, default: false },
  passwordResetToken: String,
  passwordResetExpires: Date,
}, { timestamps: true });

// Tạo OTP
passwordResetSchema.methods.createOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 chữ số
  this.resetOTP = otp;
  this.resetOTPExpires = Date.now() + 5 * 60 * 1000; // 5 phút
  return otp;
};

// Tạo reset token
passwordResetSchema.methods.createResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 phút
  return resetToken;
};

module.exports = mongoose.model("PasswordReset", passwordResetSchema);
