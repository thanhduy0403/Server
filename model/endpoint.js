const mongoose = require("mongoose");
const endpointSchema = new mongoose.Schema({
  title: { type: String, required: true },
  path: { type: String, required: true },
  methods: [{ type: String, enum: ["GET", "POST", "PUT", "PATCH", "DELETE"] }],
  name: String,
});

module.exports = mongoose.model("Endpoint", endpointSchema);
