const favoriteController = require("../../Controllers/User/favoriteControllers");
const { verifyToken } = require("../../middleware/verifyToken");

const router = require("express").Router();

// add favorite
router.post("/:id", verifyToken, favoriteController.addToFavorite);

// get favorite by user
router.get("/getFavorite", verifyToken, favoriteController.getCreateByUser);

// delete Item
router.delete("/:id", verifyToken, favoriteController.deleteItemFavorite);
module.exports = router;
