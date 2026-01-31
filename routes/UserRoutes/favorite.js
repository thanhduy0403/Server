const favoriteController = require("../../Controllers/User/favoriteControllers");
const { verifyToken, protectRouter } = require("../../middleware/verifyToken");

const router = require("express").Router();

// add favorite
router.post("/:id", protectRouter, favoriteController.addToFavorite);

// get favorite by user
router.get("/getFavorite", protectRouter, favoriteController.getCreateByUser);

// delete Item
router.delete("/:id", protectRouter, favoriteController.deleteItemFavorite);
module.exports = router;
