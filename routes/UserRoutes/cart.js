const router = require("express").Router();

const { verifyToken, protectRouter } = require("../../middleware/verifyToken");
const cartControllers = require("../../Controllers/User/cartControllers");

// add To Cart
router.post("/:id", protectRouter, cartControllers.addCart);

//get Car CreateBy
router.get("/getCart", protectRouter, cartControllers.getCart);

//update Cart
router.patch("/:id", protectRouter, cartControllers.updateCart);

// deleteCart
router.delete("/:id", protectRouter, cartControllers.deleteItem);
module.exports = router;
