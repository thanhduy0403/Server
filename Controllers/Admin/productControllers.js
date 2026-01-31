const Product = require("../../model/product");
const User = require("../../model/User");
const Category = require("../../model/category");
const productControllers = {
  postProducts: async (req, res) => {
    const {
      name,
      description,
      price,
      sizes,
      stock,
      discount,
      categoryID,
      productType,
    } = req.body;
    try {
      if (
        !name ||
        !description ||
        !price ||
        // !sizes ||
        !discount ||
        !categoryID
      ) {
        return res
          .status(403)
          .json({ success: false, message: "Vui lòng điền đầy đủ thông tin" });
      }

      if (
        !req.files ||
        !req.files["image"] ||
        req.files["image"].length === 0
      ) {
        return res
          .status(403)
          .json({ success: false, message: "Vui lòng tải lên hình ảnh" });
      }
      const imageUrl = req.files?.image ? req.files.image[0].path : null;
      // ảnh phụ
      const galleryUrls = req.files?.gallery
        ? req.files.gallery.map((file) => file.path)
        : [];

      // Convert sizes to Map object (ensure it's an object first)
      let parsedSizes;
      try {
        //   // Nếu từ JSON gửi lên là string, cần parse
        parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu sizes không hợp lệ. Phải là JSON object.",
        });
      }

      if (
        (!parsedSizes || parsedSizes.length === 0) &&
        (!stock || stock <= 0)
      ) {
        return res.status(400).json({
          success: false,
          message: "Sản phẩm không có size thì phải có stock > 0",
        });
      }
      console.log(parsedSizes);
      const createProduct = new Product({
        name: name,
        // imageID: req.file.filename,
        image: imageUrl,
        productType: productType,
        gallery: galleryUrls,
        description: description,
        price: price,
        sizes: parsedSizes && parsedSizes.length > 0 ? parsedSizes : [],
        stock: parsedSizes && parsedSizes.length > 0 ? null : stock,
        discount: discount,
        categoryID: categoryID,
      });
      console.log(createProduct);
      await createProduct.save();

      const category = await Category.findById(categoryID); ///tìm kiếm id category dựa vào model Category
      if (category) {
        //nếu có
        //thêm sản phẩm vào trong mảng products ở trong model Category
        category.products.push(createProduct._id); // thêm id của product vào model Category
        category.save(); // lưu
      } else {
        return res
          .status(403)
          .json({ success: false, message: "Không tồn tại danh mục sản phẩm" });
      }

      return res.status(200).json({
        success: true,
        message: "Tạo mới sản phẩm thành công",
        data: createProduct,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Error" });
    }
  },

  getListProducts: async (req, res) => {
    try {
      const getList = await Product.find().populate("categoryID", "name");
      if (!getList) {
        return res
          .status(403)
          .json({ success: false, message: "Xem thất bại" });
      }
      return res.status(200).json({
        success: true,
        products: getList,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Error" });
    }
  },

  getDetailProduct: async (req, res) => {
    const idProduct = req.params.id;

    try {
      const getOne = await Product.findById(idProduct);
      if (!getOne) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy sản phẩm" });
      }
      return res
        .status(200)
        .json({ success: true, message: "Chi tiết sản phẩm", getOne });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi Params" });
    }
  },

  UpdateProduct: async (req, res) => {
    const idProduct = req.params.id;
    const {
      name,
      description,
      price,
      sizes,
      stock,
      discount,
      categoryID,
      productType,
    } = req.body;

    try {
      // Kiểm tra thông tin bắt buộc
      if (!name || !description || !price || !categoryID) {
        return res
          .status(403)
          .json({ success: false, message: "Vui lòng điền đầy đủ thông tin" });
      }

      // Tìm kiếm sản phẩm theo ID
      const checkIDProduct = await Product.findById(idProduct);
      if (!checkIDProduct) {
        return res
          .status(403)
          .json({ success: false, message: "Không tồn tại sản phẩm" });
      }

      // Kiểm tra sự tồn tại của danh mục sản phẩm
      const checkIDCategory = await Category.findById(categoryID);
      if (!checkIDCategory) {
        return res
          .status(403)
          .json({ success: false, message: "Không tồn tại danh mục sản phẩm" });
      }

      // Lưu ID danh mục cũ trước khi cập nhật
      const oldCategory = checkIDProduct.categoryID;

      // Kiểm tra và lấy thông tin ảnh (nếu có)
      // nếu có thay đổi ảnh thì req.file?.path
      // không thì sử dụng ảnh cũ checkIDProduct.image;

      //ảnh chính
      const imageUrl = req.files?.image
        ? req.files.image[0].path
        : null || checkIDProduct.image;

      // Ảnh phụ cũ giữ lại
      const oldGallery = req.body.oldGallery
        ? JSON.parse(req.body.oldGallery)
        : checkIDProduct.gallery || [];

      // Ảnh phụ mới upload
      const newGallery = req.files?.gallery
        ? req.files.gallery.map((file) => file.path)
        : [];

      // merge ảnh cũ + ảnh mới
      const finalGallery = [...oldGallery, ...newGallery];
      let parsedSizes;
      try {
        //   // Nếu từ JSON gửi lên là string, cần parse
        parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu sizes không hợp lệ. Phải là JSON object.",
        });
      }
      if (
        (!parsedSizes || parsedSizes.length === 0) &&
        (!stock || stock.length <= 0)
      ) {
        return res.status(400).json({
          success: false,
          message: "Sản phẩm không có size thì phải có stock > 0",
        });
      }
      // Cập nhật sản phẩm
      const updateData = await Product.findByIdAndUpdate(
        idProduct,
        {
          name: name,
          image: imageUrl,
          productType: productType,
          gallery: finalGallery,
          description: description,
          price: price,
          sizes: parsedSizes && parsedSizes.length > 0 ? parsedSizes : [],
          stock: parsedSizes && parsedSizes.length > 0 ? null : stock,
          discount: discount,
          categoryID: categoryID,
        },
        { new: true }
      );

      // Nếu danh mục thay đổi, cập nhật danh mục cũ và mới
      if (oldCategory.toString() !== categoryID) {
        // Xóa sản phẩm khỏi danh mục cũ
        await Category.updateOne(
          { _id: oldCategory },
          { $pull: { products: idProduct } }
        );

        // Thêm sản phẩm vào danh mục mới
        await Category.updateOne(
          { _id: categoryID },
          { $push: { products: idProduct } }
        );
      }

      return res.status(200).json({
        success: true,
        message: "Cập nhật sản phẩm thành công",
        data: updateData,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Đã xảy ra lỗi, vui lòng thử lại sau",
      });
    }
  },

  DeleteProduct: async (req, res) => {
    const idProduct = req.params.id;
    try {
      const deleteItem = await Product.findById(idProduct);
      if (!deleteItem) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy sản phẩm" });
      }
      await Product.findByIdAndDelete(idProduct);
      return res
        .status(200)
        .json({ success: true, message: "Xóa sản phẩm thành công" });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error" });
    }
  },
};

module.exports = productControllers;
