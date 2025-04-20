const express = require("express");
const Expenses = require("../models/Expenses");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ Add an Expense (When an item is added to inventory)
router.post("/add", protect, async (req, res) => {
  try {
    const { itemName, category, quantity, price } = req.body;
    const totalCost = quantity * price;

    const newExpense = new Expenses({
      itemName,
      category,
      quantity,
      price,
      totalCost,
      addedBy: req.user.id,
    });

    await newExpense.save();
    res.status(201).json({ message: "Expense recorded successfully!", newExpense });
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ message: "Error adding expense" });
  }
});
// ✅ Update an Expense (Fix Total Cost Calculation)
router.put("/update/:id", protect, async (req, res) => {
  try {
    const { itemName, category, quantity, price } = req.body;

    const expense = await Expenses.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // ✅ Recalculate total cost (quantity * price)
    const totalCost = (quantity || expense.quantity) * (price || expense.price);

    // ✅ Update expense details
    expense.itemName = itemName || expense.itemName;
    expense.category = category || expense.category;
    expense.quantity = quantity !== undefined ? quantity : expense.quantity;
    expense.price = price !== undefined ? price : expense.price;
    expense.totalCost = totalCost; // ✅ Updated correctly!

    await expense.save();
    res.json({ message: "Expense updated successfully!", expense });
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ message: "Failed to update expense" });
  }
});


// ✅ Get All Expenses (For the Expenses Page)
router.get("/", protect, async (req, res) => {
  try {
    const expenses = await Expenses.find({ addedBy: req.user.id });
    res.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ message: "Error fetching expenses" });
  }
});

// ✅ Delete an Expense
router.delete("/delete/:id", protect, async (req, res) => {
  try {
    const expense = await Expenses.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    await expense.deleteOne();
    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: "Error deleting expense" });
  }
});

module.exports = router;
