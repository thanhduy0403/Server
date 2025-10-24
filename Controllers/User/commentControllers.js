const Comment = require("../../model/comment");
const { v4: uuidv4 } = require("uuid");

const commentControllers = {
  createComment: async (req, res) => {
    try {
      const productID = req.params.id;
      const { question, guestName } = req.body;

      const userID = req.user?.id;
      //    dành cho user đã đăng nhập
      if (userID) {
        if (!question || question.trim() === "") {
          return res
            .status(403)
            .json({ success: false, message: "Hãy nhập nội dung" });
        }
        const newComment = new Comment({
          productID: productID,
          userID: userID,
          question: question.trim(),
        });
        await newComment.save();

        return res.status(200).json({
          success: true,
          message: "gửi nội dung thành công",
          newComment,
        });
      }

      //    dành cho khách chưa đăng nhập
      if (!guestName || guestName.trim() === "") {
        return res
          .status(403)
          .json({ success: false, message: "Hãy điền tên của bạn" });
      }
      if (!question || question.trim() === "") {
        return res
          .status(403)
          .json({ success: false, message: "Hãy nhập nội dung" });
      }

      const newComment = await Comment({
        productID: productID,
        guestName: guestName.trim(),
        question: question.trim(),
      });
      await newComment.save();
      return res.status(200).json({
        success: true,
        message: "gửi nội dung thành công",
        newComment,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
  replyComment: async (req, res) => {
    const commentID = req.params.id;
    const { replyText, guestName } = req.body;
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
      // lây thông tin comment hiện có
      const comment = await Comment.findById(commentID);
      if (!comment) {
        return res
          .status(403)
          .json({ success: false, message: "Bình luận không tồn tại" });
      }
      let newReply = {};
      const userID = req.user?.id;
      if (userID) {
        newReply = {
          userID: userID,
          replyText: replyText,
        };
      } else {
        if (!guestName || guestName.trim() === "") {
          return res
            .status(400)
            .json({ success: false, message: "Hãy điền tên của bạn" });
        }
        newReply = {
          guestName: guestName,
          replyText: replyText,
        };
      }
      comment.replies.push(newReply);
      comment.status = "answered";
      await comment.save();
      return res
        .status(200)
        .json({ success: true, message: "Trả lời thành công", comment });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Error" });
    }
  },

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
  deleteCommentOrReply: async (req, res) => {
    try {
      const { commentID, replyID } = req.params;
      const userID = req.user?.id;

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

        const isReplyOwner =
          // reply của user
          reply.userID && userID && reply.userID.toString() === userID;

        if (!isReplyOwner) {
          return res
            .status(403)
            .json({ success: false, message: "Không có quyền xóa reply này" });
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
      const isCommentOwner =
        // comment của user
        comment.userID && userID && comment.userID.toString() === userID;

      if (!isCommentOwner) {
        return res
          .status(403)
          .json({ success: false, message: "Không có quyền xoá comment này" });
      }

      await Comment.findByIdAndDelete(commentID);
      return res
        .status(200)
        .json({ success: true, message: "Xóa comment thành công" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
  updateCommentOrReply: async (req, res) => {
    try {
      const { commentID, replyID } = req.params;
      const userID = req.user.id;
      const { replyText, question } = req.body;
      const comment = await Comment.findById(commentID);
      // cập nhật comment
      if (!comment) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy comment" });
      }
      if (replyID) {
        const reply = comment.replies.id(replyID);
        if (!reply) {
          return res
            .status(403)
            .json({ success: false, message: "Không tìm thấy phản hồi" });
        }
        const isReplyOwner = reply.userID && reply.userID.toString() === userID;
        if (!isReplyOwner) {
          return res.status(403).json({
            success: false,
            message: "Không có quyền sửa  phản hồi này",
          });
        }
        reply.replyText = replyText;
        await comment.save();
        return res.status(200).json({
          success: true,
          message: "Cập nhật phản hồi thành công",
        });
      }
      //  cập nhật comment
      const isCommentOwner =
        comment.userID && comment.userID.toString() === userID;
      if (!isCommentOwner) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền sửa comment này",
        });
      }
      comment.question = question;
      await comment.save();
      return res.status(200).json({
        success: true,
        message: "Cập nhật comment thành công",
      });
    } catch (error) {
      return res.status(500).json({
        success: true,
        message: "Lỗi server",
      });
    }
  },
};

module.exports = commentControllers;
