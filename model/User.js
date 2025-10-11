const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  status: {
    type: "String",
    enum: ["Hoạt động", "Đã xóa"],
    default: "Hoạt động",
  },
  phoneNumber: {
    type: Number,
  },
  address: {
    type: "String",
  },
  introduce_yourself: {
    type: "String",
  },
  last_name: {
    type: "String",
  },
  first_name: {
    type: "String",
  },
  date_of_birth: {
    type: "String",
  },
  gender: {
    type: "String",
  },
  role: {
    type: Number,
    default: 0,
  },
  // 0 user , 1 admin , 2 sub admin
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isDelete: {
    type: Boolean,
    default: false,
  },
  // Token reset password (dành cho đường dẫn)
  passwordChangedAt: {
    type: String,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: String,
  },
  // Mã OTP và thời gian hết hạn (dành cho bước xác thực OTP)
  resetOTP: {
    type: String,
  },
  resetOTPExpires: {
    type: String,
  },
  resetVerified: {
    type: Boolean,
    default: false,
  },

  // permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],
  // allowedEndpoints: [{ type: mongoose.Schema.Types.ObjectId }],
});

userSchema.methods.createPasswordChangedToken = function (password) {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

userSchema.methods.createPasswordResetOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 chữ số
  this.resetOTP = otp;
  this.resetOTPExpires = Date.now() + 5 * 60 * 1000;
  return otp;
};

// userSchema.pre("save", async function (next) {
//   if (this.isModified("password")) {
//     this.password = await bcrypt.hash(this.password, 10);
//   }
//   next();
// });

module.exports = mongoose.model("User", userSchema);
