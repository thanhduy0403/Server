const chatController = require("../../Controllers/User/chatControllers");

const router = require("express").Router();
// router.post("/chat", chatController.chatWithBot);
router.post("/chatbot", chatController.handleMessage);

module.exports = router;
