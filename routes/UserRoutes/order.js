const router = require("express").Router();

const { verifyToken } = require("../../middleware/verifyToken");
const orderControllers = require("../../Controllers/User/orderControllers");

//Create_Order
router.post("/:id", verifyToken, orderControllers.createOrder);

//Get CreateBy
router.get("/getCreateBy", verifyToken, orderControllers.getCreateByUser);

// get OderID
router.get("/:id", verifyToken, orderControllers.getDetailOrder);

//Update Order
router.patch("/:id", verifyToken, orderControllers.updateOrder);

// Cancel Order
router.delete("/:id", verifyToken, orderControllers.cancel_Order);
module.exports = router;
