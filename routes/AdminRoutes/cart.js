const router = require("express").Router();
const cartControllers = require("../../Controllers/Admin/cartControllers");
const {
  verifyToken,
  verifyTokenAdmin,
} = require("../../middleware/verifyToken");

// add To Cart
router.post("/:id", verifyToken, cartControllers.addCart);

//get cart Create By
router.get("/getCart", verifyToken, cartControllers.getCart);

//get List cart
router.get("/getList", verifyTokenAdmin, cartControllers.getAll);

//update Cart
router.patch("/:id", verifyToken, cartControllers.updateCart);

// delete Item Cart
router.delete("/:id", verifyToken, cartControllers.deleteItemCart);

module.exports = router;
