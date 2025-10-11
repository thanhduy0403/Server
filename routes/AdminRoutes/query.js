const router = require("express").Router();
const {
  getDashboardStart,
  getDailyData,
} = require("../../Controllers/Admin/query");
const {
  verifyTokenOnLyAdmin,
  verifyTokenAdmin,
} = require("../../middleware/verifyToken");

router.get("/dsh", verifyTokenAdmin, getDashboardStart);
router.get("/daily", verifyTokenAdmin, getDailyData);
module.exports = router;
