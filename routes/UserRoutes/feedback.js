const feedbackControllers = require("../../Controllers/User/feedbackControllers");
const { verifyToken } = require("../../middleware/verifyToken");

const router = require("express").Router();

// create feedback
router.post(
  "/createFeedback/:orderID/:productID",
  verifyToken,
  feedbackControllers.createFeedback
);

// get list feedback
router.get("/getList/:id", feedbackControllers.getFeedback);

module.exports = router;
