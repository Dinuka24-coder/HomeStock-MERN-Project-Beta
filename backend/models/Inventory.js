const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Tracks who added it
  consumedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Tracks users who consumed it
  dateAdded: { type: Date, default: Date.now },
  expiryDate: { type: Date, required: false },
  price: { type: Number, required: true }, // This will later be linked with Expenses
});

module.exports = mongoose.model("Inventory", inventorySchema);

//Final update for review
