const Category = require("../../model/category");

const categoryControllers = {
  postCategory: async (req, res) => {
    const { name, description } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập name" });
    }
    const imageUrl = req.file.path;
    try {
      const newCategory = new Category({
        name: name,
        image: imageUrl,
        description: description,
      });

      await newCategory.save();

      return res.status(200).json({
        success: true,
        message: "Tạo mới thành công",
        data: newCategory,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(403)
        .json({ success: false, message: "Tạo mới thất bại" });
    }
  },
  // xem tất cả category product
  getCategory: async (req, res) => {
    try {
      const getAll = await Category.find().populate("products");
      if (!getAll) {
        return res
          .status(400)
          .json({ success: false, message: "Xem danh mục sản phẩm thất bại" });
      }

      let totalProduct = 0;
      const categories = getAll.map((category) => {
        const productCount = category.products.length;
        totalProduct += productCount;
        return {
          ...category._doc,
          productCount,
        };
      });
      return res.status(200).json({ success: true, totalProduct, categories });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Error" });
    }
  },

  // xem category product do admin nào tạo ra
  getCreateBy: async (req, res) => {
    // const createBy = req.user.id;
    // try {
    //   console.log(createBy);
    //   const getBy = await Category.find({
    //     createBy: createBy,
    //   })
    //     .populate("createBy", "username")
    //     .populate("updateBy", "username")
    //     .populate("products");
    //   console.log(getBy);
    //   if (!getBy) {
    //     return res
    //       .status(400)
    //       .json({ success: false, message: "Xem thất bại" });
    //   }
    //   return res
    //     .status(200)
    //     .json({ success: true, message: "Danh mục sản phẩm", data: getBy });
    // } catch (error) {
    //   return res.status(500).json({ success: false, message: "Error" });
    // }
  },
  getDetail: async (req, res) => {
    const idCategory = req.params.id;
    try {
      const getDetailCate = await Category.findById(idCategory).populate(
        "products"
      );
      if (!getDetailCate) {
        return res
          .status(400)
          .json({ success: false, message: "Xem thất bại" });
      }
      return res.json(getDetailCate);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Error" });
    }
  },

  updateCategory: async (req, res) => {
    const updateID = req.params.id;
    const { name, description } = req.body;
    try {
      if (!name) {
        return res.status(403).json({
          success: false,
          message: "tên danh mục không được bỏ trống",
        });
      }

      const categoryID = await Category.findById(updateID);
      const imageUrl = req.file?.path || categoryID.image;
      const updateData = await Category.findByIdAndUpdate(
        updateID,
        {
          name: name,
          description: description,
          image: imageUrl,
        },
        { new: true }
      );
      console.log(updateData);
      if (!updateData) {
        return res
          .status(401)
          .json({ success: false, message: "Không tồn tại Category" });
      } else {
        await updateData.save();
        return res.status(200).json({
          success: true,
          message: "Cập nhật thành công",
          newUpdate: updateData,
        });
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error" });
    }
  },

  deleteCategory: async (req, res) => {
    const idCategory = req.params.id;
    try {
      const deleteItem = await Category.findByIdAndDelete(idCategory);
      if (!deleteItem) {
        return res
          .status(401)
          .json({ success: false, message: "Danh mục sản phẩm không tồn tại" });
      }

      return res
        .status(200)
        .json({ success: true, message: "Xóa danh mục sản phẩm thành công" });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error" });
    }
  },
};

module.exports = categoryControllers;
