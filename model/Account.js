const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const accountSchema = new Schema({
  fullname: {
    type: String,
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  position: {
    type: String,
    enum: ["admin", "subadmin"],
    default: "subadmin",
  },
  role: {
    type: String, // Đổi kiểu từ Number thành String
    enum: ["admin", "subadmin"], // Giới hạn các giá trị hợp lệ cho role
    default: "subadmin", // Giá trị mặc định là subadmin
  },
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],
  allowedEndpoints: [{ type: mongoose.Schema.Types.ObjectId }],
});

module.exports = mongoose.model("Account", accountSchema);
