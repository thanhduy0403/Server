const router = require("express").Router();
const {
  verifyTokenOnLyAdmin,
  verifyTokenAdmin,
  checkPermission,
} = require("../../middleware/verifyToken");
const permissionControllers = require("../../Controllers/Admin/permissionController");

// thêm quyền
router.post(
  "/create",
  verifyTokenAdmin,
  checkPermission,
  permissionControllers.create
);

// danh sách quyền
router.get(
  "/getList",
  verifyTokenAdmin,
  checkPermission,
  permissionControllers.getPermission
);

router.patch(
  "/assign_permission/:id",
  verifyTokenAdmin,
  checkPermission,
  permissionControllers.assignPermission
);

router.delete(
  "/revokeEndpointPermission/:id",
  verifyTokenAdmin,
  checkPermission,
  permissionControllers.revokeEndpointPermission
);

module.exports = router;
