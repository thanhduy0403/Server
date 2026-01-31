const bannerControllers = require("../../Controllers/User/bannerControllers");

const router = require("express").Router();

// Get all banner
router.get("/get_All", bannerControllers.getAllBanner);

// Get detail banner
router.get("/:id", bannerControllers.getDetailBanner);
module.exports = router;
