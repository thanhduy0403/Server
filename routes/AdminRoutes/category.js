const router = require("express").Router();
const categoryControllers = require("../../Controllers/Admin/categoryControllers");
const {
  verifyTokenAdmin,
  verifyToken,
  checkPermission,
  checkNewPermission,
} = require("../../middleware/verifyToken");

const upImage = require("../AdminRoutes/upLoadImage");

//post category
router.post(
  "/post",
  upImage.single("image"),
  verifyTokenAdmin,
  checkPermission,
  categoryControllers.postCategory
);
// get List
router.get(
  "/getList",
  verifyTokenAdmin,
  checkPermission,
  categoryControllers.getCategory
);
// get List by admin
router.get("/getBy", verifyTokenAdmin, categoryControllers.getCreateBy);

// getDetail
router.get(
  "/:id",
  verifyTokenAdmin,
  checkPermission,
  categoryControllers.getDetail
);
// update Category
router.patch(
  "/:id",
  upImage.single("image"),
  verifyTokenAdmin,
  checkPermission,
  categoryControllers.updateCategory
);
// delete
router.delete(
  "/:id",
  verifyTokenAdmin,
  checkPermission,
  categoryControllers.deleteCategory
);
module.exports = router;
