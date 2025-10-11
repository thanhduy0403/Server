const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dqmmspc2k",
  api_key: "761524879279354",
  api_secret: "2BJ-N566SFeobmIsXF24IlTUs0M",
});

module.exports = cloudinary;
