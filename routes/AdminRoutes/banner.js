const bannerControllers = require("../../Controllers/Admin/bannerControllers");
const {
  verifyTokenAdmin,
  checkPermission,
} = require("../../middleware/verifyToken");
const upload = require("./upLoadImage");

const router = require("express").Router();

// Create Banner
router.post(
  "/create_banner",
  upload.single("image"),
  verifyTokenAdmin,
  checkPermission,
  bannerControllers.createBanner
);

// Get All
router.get(
  "/get_All",
  verifyTokenAdmin,
  checkPermission,
  bannerControllers.getAllBanner
);

// Get Detail Banner
router.get(
  "/:id",
  verifyTokenAdmin,
  checkPermission,
  bannerControllers.getDetailBanner
);
router.patch(
  "/:id",
  upload.single("image"),
  verifyTokenAdmin,
  checkPermission,
  bannerControllers.updateBanner
);
router.delete(
  "/:id",
  verifyTokenAdmin,
  checkPermission,
  bannerControllers.deleteBanner
);
module.exports = router;
