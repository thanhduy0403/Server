const router = require("express").Router();
const productControllers = require("../../Controllers/Admin/productControllers");
const {
  verifyTokenAdmin,
  verifyToken,
  checkPermission,
} = require("../../middleware/verifyToken");
const upImage = require("./upLoadImage");

// post product
// upImage.single("image"), chỉ up 1 ảnh
router.post(
  "/post",
  upImage.fields([
    { name: "image", maxCount: 1 },
    {
      name: "gallery",
      maxCount: 5,
    },
  ]),
  verifyTokenAdmin,
  checkPermission,
  productControllers.postProducts
);
// get list products
router.get(
  "/getList",
  verifyTokenAdmin,
  checkPermission,
  productControllers.getListProducts
);
// get detail product
router.get(
  "/:id",
  verifyTokenAdmin,
  checkPermission,
  productControllers.getDetailProduct
);
// update product
router.patch(
  "/:id",
  upImage.fields([
    { name: "image", maxCount: 1 },
    {
      name: "gallery",
      maxCount: 5,
    },
  ]),
  verifyTokenAdmin,
  checkPermission,
  productControllers.UpdateProduct
);
// delete Product
router.delete(
  "/:id",
  verifyTokenAdmin,
  checkPermission,
  productControllers.DeleteProduct
);

module.exports = router;
