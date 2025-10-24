const Comment = require("../../model/comment");

const commentControllers = {
  getCommentProduct: async (req, res) => {
    try {
      const productID = req.params.id;
      const comments = await Comment.find({ productID })
        .populate("userID", "username") // Comment của user đăng nhập
        .populate("guestName", "guestName") // Reply của khách
        .populate("replies.userID", "username") // Reply của user đăng nhập
        .populate("replies.guestName", "guestName") // Reply của khách
        .populate("replies.accountID", "fullname") // Reply của admin
        .sort({ createdAt: -1 })
        .lean();
      if (!comments || comments.length === 0) {
        return res.status(200).json({
          success: true,
          message: "Sản phẩm chưa có comment nào",
          comments: [],
        });
      }
      const formatted = comments.map((c) => {
        let author;
        if (c.userID) {
          author = {
            type: "user",
            username: c.userID.username,
          };
        } else {
          author = {
            type: "guest",
            guestName: c.guestName,
          };
        }
        // Format replies
        const replies = c.replies.map((r) => {
          let replyAuthor;
          if (r.accountID) {
            replyAuthor = {
              type: "admin", // admin hoăc subadmin
              fullname: r.accountID.fullname,
            };
          } else if (r.userID) {
            replyAuthor = {
              type: "user",
              username: r.userID.username,
            };
          } else {
            replyAuthor = {
              type: "guest",
              guestName: r.guestName,
            };
          }
          return {
            _id: r._id,
            replyText: r.replyText,
            isOfficialAnswer: r.isOfficialAnswer,
            createdAt: r.createdAt,
            author: replyAuthor,
          };
        });
        return {
          _id: c._id,
          question: c.question,
          createdAt: c.createdAt,
          status: c.status,
          author,
          replies,
        };
      });

      return res.status(200).json({
        success: true,
        message: "Comment của sản phẩm",
        formatted,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Error" });
    }
  },
  adminReplyComment: async (req, res) => {
    const commentID = req.params.id;
    const { replyText } = req.body;
    try {
      if (!commentID) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy comment" });
      }
      if (!replyText || replyText.trim() === "") {
        return res
          .status(403)
          .json({ success: false, message: "Hãy nhập nội dung trả lời" });
      }
      const comment = await Comment.findById(commentID);
      // lấy thông tin chi tiết comment hiện có
      if (!comment) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy comment" });
      }
      let newReply = {};
      const accountID = req.user?.id;
      if (accountID) {
        newReply = {
          replyText: replyText,
          accountID: accountID,
          isOfficialAnswer: true,
        };
      }
      comment.replies.push(newReply);
      comment.status = "answered";

      await comment.save();
      return res
        .status(200)
        .json({ success: true, message: "Trả lời thành công", comment });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  deleteCommentOrReply: async (req, res) => {
    const { commentID, replyID } = req.params;
    const accountID = req.user?.id;
    try {
      const comment = await Comment.findById(commentID);
      if (!comment) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy comment" });
      }
      // ===============================
      // 🟨 XÓA REPLY
      // ===============================
      if (replyID) {
        const reply = comment.replies.id(replyID);
        if (!reply) {
          return res
            .status(404)
            .json({ success: false, message: "Không tìm thấy reply" });
        }
        reply.deleteOne();
        await comment.save();
        return res
          .status(200)
          .json({ success: true, message: "Xóa reply thành công" });
      }
      // ===============================
      // 🟥 XÓA COMMENT
      // ===============================
      await Comment.findByIdAndDelete(commentID);
      return res
        .status(200)
        .json({ success: true, message: "Xóa comment thành công" });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
};

module.exports = commentControllers;
