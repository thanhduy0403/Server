const commentControllers = require("../../Controllers/Admin/commentControllers");
const {
  checkPermission,
  verifyTokenAdmin,
  verifyToken,
} = require("../../middleware/verifyToken");

const router = require("express").Router();

// reply comment admin
router.post(
  "/reply/:id",
  verifyTokenAdmin,
  checkPermission,
  commentControllers.adminReplyComment
);

// delete reply
router.delete(
  "/:commentID/reply/:replyID",
  verifyTokenAdmin,
  checkPermission,
  commentControllers.deleteCommentOrReply
);

// delete comment
router.delete(
  "/:commentID",
  verifyTokenAdmin,
  checkPermission,
  commentControllers.deleteCommentOrReply
);
// get comment product
router.get(
  "/getComment/:id",
  verifyTokenAdmin,
  checkPermission,
  commentControllers.getCommentProduct
);

module.exports = router;
