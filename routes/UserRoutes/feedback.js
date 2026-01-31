const feedbackControllers = require("../../Controllers/User/feedbackControllers");
const { verifyToken, protectRouter } = require("../../middleware/verifyToken");

const router = require("express").Router();

// create feedback
router.post(
  "/createFeedback/:orderID/:productID",
  protectRouter,
  feedbackControllers.createFeedback,
);

// get list feedback
router.get("/getList/:id", feedbackControllers.getFeedback);

module.exports = router;
