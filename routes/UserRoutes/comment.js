const commentControllers = require("../../Controllers/User/commentControllers");
const { protect } = require("../../middleware/verifyToken");

const router = require("express").Router();

//  create Comment
router.post("/createComment/:id", protect, commentControllers.createComment);
// reply Comment
router.post("/reply/:id", protect, commentControllers.replyComment);

// get Comment ProductID
router.get("/getComment/:id", commentControllers.getCommentProduct);

// delete  reply
router.delete(
  "/:commentID/reply/:replyID/",
  protect,
  commentControllers.deleteCommentOrReply
);
// delete  comment
router.delete("/:commentID", protect, commentControllers.deleteCommentOrReply);

// update reply
router.patch(
  "/:commentID/reply/:replyID",
  protect,
  commentControllers.updateCommentOrReply
);
// update comment
router.patch("/:commentID", protect, commentControllers.updateCommentOrReply);
module.exports = router;
