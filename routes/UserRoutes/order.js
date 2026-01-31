const router = require("express").Router();

const { verifyToken, protectRouter } = require("../../middleware/verifyToken");
const orderControllers = require("../../Controllers/User/orderControllers");

//Create_Order
router.post("/:id", protectRouter, orderControllers.createOrder);

//Get CreateBy
router.get("/getCreateBy", protectRouter, orderControllers.getCreateByUser);

// get OderID
router.get("/:id", protectRouter, orderControllers.getDetailOrder);

//confirm_Received
router.patch("/:id", protectRouter, orderControllers.confirm_Received);

//Update Order
router.patch("/changeAddress/:id", protectRouter, orderControllers.updateOrder);

// Cancel Order
router.delete("/:id", protectRouter, orderControllers.cancel_Order);
module.exports = router;
