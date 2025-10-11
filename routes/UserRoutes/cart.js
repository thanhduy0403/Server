const router = require("express").Router();

const { verifyToken } = require("../../middleware/verifyToken");
const cartControllers = require("../../Controllers/User/cartControllers");

// add To Cart
router.post("/:id", verifyToken, cartControllers.addCart);

//get Car CreateBy
router.get("/getCart", verifyToken, cartControllers.getCart);

//update Cart
router.patch("/:id", verifyToken, cartControllers.updateCart);

// deleteCart
router.delete("/:id", verifyToken, cartControllers.deleteItem);
module.exports = router;
