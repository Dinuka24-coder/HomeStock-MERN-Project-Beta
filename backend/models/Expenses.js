const mongoose = require("mongoose");

const ExpensesSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  totalCost: { type: Number, required: true }, // quantity * price
  date: { type: Date, default: Date.now }, // Automatically sets the date
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Tracks which user added it
});

module.exports = mongoose.model("Expenses", ExpensesSchema);//exporting to mongo
