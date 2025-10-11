const router = require("express").Router();
const productControllers = require("../../Controllers/User/productControllers");

// get list product
router.get("/getList", productControllers.getListProducts);
// get detail product
router.get("/:id", productControllers.getDetailProduct);

module.exports = router;
