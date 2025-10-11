const router = require("express").Router();

const { Router } = require("express");
const categoryControllers = require("../../Controllers/User/categoryControllers");
const {
  verifyToken,
  verifyTokenAdminAndUser,
} = require("../../middleware/verifyToken");

// Get list category
router.get("/getList", categoryControllers.getCategory);
// Get detail category
router.get("/:id", categoryControllers.getDetailCategory);
module.exports = router;
