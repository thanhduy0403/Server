const Feedback = require("../../model/feedback");
const Order = require("../../model/order");
const Product = require("../../model/product");
const mongoose = require("mongoose");
const User = require("../../model/User");
const feedbackControllers = {
  createFeedback: async (req, res) => {
    const userID = req.user?.id;
    const { rating, comment, size } = req.body;
    const { orderID, productID } = req.params;
    try {
      if (rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ success: false, message: "Rating không hợp lệ (1-5)" });
      }
      const order = await Order.findOne({ _id: orderID, userInfo: userID });
      if (!order) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy đơn hàng" });
      }
      if (
        order.orderStatus !== "Hoàn Thành" &&
        order.receivedStatus !== "Đã Nhận"
      ) {
        return res.status(400).json({
          success: false,
          message: "Chỉ được đánh giá khi đã nhận đơn hàng",
        });
      }
      const hashProduct = order.products.some(
        (item) => item.product.toString() === productID
      );
      if (!hashProduct) {
        return res.status(400).json({
          success: false,
          message: "Sản phẩm này không thuộc đơn hàng không thể đánh giá",
        });
      }
      // kiểm tra đã feedback chưa
      const existed = await Feedback.findOne({
        orderID: orderID,
        productID: productID,
        userID: userID,
        size: size,
      });
      if (existed) {
        return res.status(400).json({
          success: false,
          message: "Bạn đã đánh giá sản phẩm này rồi",
        });
      }
      await User.updateOne({ _id: userID }, { $inc: { point: 300 } });
      // chưa feedback
      const newFeedback = await Feedback.create({
        rating: rating,
        comment: comment,
        size: size,
        orderID: orderID,
        productID: productID,
        userID: userID,
      });
      await Product.updateOne(
        { _id: productID },
        {
          $inc: {
            "ratingSummary.totalRating": 1,
            [`ratingSummary.startCounts.${rating}`]: 1,
          },
        }
      );
      await newFeedback.save();
      return res.status(200).json({
        success: true,
        message: "Cảm ơn bạn đã đánh giá sản phẩm",
        newFeedback,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },
  getFeedback: async (req, res) => {
    const productID = req.params.id;
    try {
      const feedbackList = await Feedback.find({ productID })
        .populate("userID", "username")
        .sort({ createdAt: -1 });
      if (!feedbackList || feedbackList.length === 0) {
        return res.status(200).json({
          success: true,
          message: "Chưa có feedback từ người mua",
          feedbackList: [],
        });
      }
      const avgResult = await Feedback.aggregate([
        { $match: { productID: new mongoose.Types.ObjectId(productID) } },
        {
          $group: {
            _id: "$productID",
            averageRating: { $avg: "$rating" },
            totalFeedback: { $sum: 1 },
          },
        },
      ]);
      let averageRating = 0;
      let totalFeedback = 0;
      if (avgResult.length > 0) {
        averageRating = avgResult[0].averageRating;
        totalFeedback = avgResult[0].totalFeedback;
      }
      return res.status(200).json({
        success: true,
        message: "Danh sách feedback",
        totalFeedback,
        averageRating: Number(averageRating.toFixed(1)),
        feedbackList,
      });
    } catch (error) {
      console.log(error);
      return res.status(200).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },
};

module.exports = feedbackControllers;
