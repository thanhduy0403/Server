const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const endpointSchema = new Schema({
  title: { type: String, required: true },
  path: { type: String, required: true },
  methods: [{ type: String, required: true }],
});

const permissionSchema = new Schema({
  name: { type: String, required: true }, // Tên nhóm quyền: Ví dụ: "Quản lý sản phẩm"
  endpoints: [endpointSchema], // Danh sách các quyền con (endpoints) của nhóm quyền
});

module.exports = mongoose.model("Permission", permissionSchema);
