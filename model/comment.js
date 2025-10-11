const mongoose = require("mongoose");

const replySchema = mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    accountID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    guestName: {
      type: String,
      required: function () {
        return !this.userID && !this.accountID;
      },
    },
    content: {
      type: String,
      trim: true,
      required: true,
    },
    isOfficialAnswer: {
      type: Boolean,
      default: false, // Admin có thể đánh dấu đây là câu trả lời chính thức
    },
  },
  { timestamps: true }
);

const commentSchema = mongoose.Schema(
  {
    productID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    //   dành cho user đã đăng nhập
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // dành cho khách --> lưu tên khách tại đây (chưa đăng nhập)
    guestName: {
      type: String,
      trim: true,
      required: function () {
        return !this.user; // bắt buộc nếu không có user
      },
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    replies: [replySchema],
    status: {
      type: String,
      enum: ["pending", "answered", "closed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);
