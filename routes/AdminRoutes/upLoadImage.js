const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../../configs/cloudinary"); // file bạn đã có sẵn

// Cấu hình Cloudinary Storage cho multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});

// Tạo middleware upload sử dụng storage Cloudinary
const upload = multer({ storage: storage });

module.exports = upload;
