const mongoose = require("mongoose");

const replySchema = mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    accountID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account", // dành cho admin
    },
    guestName: {
      type: String,
      required: function () {
        return !this.userID && !this.accountID;
      },
    },

    replyText: {
      type: String,
      trim: true,
      required: true,
    },
    isOfficialAnswer: {
      type: Boolean,
      default: false, // Admin có thể đánh dấu đây là câu trả lời chính thức
    },
    createdAt: {
      type: Date,
      default: Date.now,
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
      required: function () {
        return !this.guestName;
      },
    },
    // dành cho khách --> lưu tên khách tại đây (chưa đăng nhập)
    guestName: {
      type: String,
      required: function () {
        return !this.userID;
      },
    },

    question: {
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
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);
