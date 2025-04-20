const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const Inventory = require("../models/Inventory");
const Expenses = require("../models/Expenses"); // Import Expenses Model

const router = express.Router();

// ✅ Add an Item to Inventory & Record Expense
router.post("/add", protect, async (req, res) => {
  try {
    const { itemName, quantity, category, expiryDate, price } = req.body;

    if (!itemName || quantity === undefined || !category || !price) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const newItem = new Inventory({
      itemName,
      quantity,
      category,
      expiryDate,
      price,
      addedBy: req.user.id, // Track who added it
    });

    await newItem.save();

    // Also add expense entry
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

    res.status(201).json({ message: "Item added to inventory and expense recorded!", newItem, newExpense });
  } catch (error) {
    console.error("Error adding item:", error);
    res.status(500).json({ message: "Failed to add item" });
  }
});

// Get All Inventory Items (Ensures items are correctly fetched)
router.get("/", protect, async (req, res) => {
  try {
    const items = await Inventory.find().populate("addedBy", "fullName email"); // Show who added items
    if (!items.length) {
      return res.status(404).json({ message: "No inventory items found" });
    }
    res.json(items);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ message: "Failed to fetch inventory" });
  }
});

// Consume an Item (Reduce Quantity)
router.put("/consume/:id", protect, async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.quantity <= 0) {
      return res.status(400).json({ message: "Item is out of stock" });
    }

    item.quantity -= 1; // Reduce item quantity
    item.consumedBy.push(req.user.id); // Track who consumed it

    await item.save();
    res.json({ message: "Item consumed", item });
  } catch (error) {
    console.error("Error consuming item:", error);
    res.status(500).json({ message: "Failed to consume item" });
  }
});

// Update an Item (Ensures all fields are properly updated)
router.put("/update/:id", protect, async (req, res) => {
  try {
    const { itemName, quantity, category, expiryDate, price } = req.body;
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    item.itemName = itemName || item.itemName;
    item.quantity = quantity !== undefined ? quantity : item.quantity;
    item.category = category || item.category;
    item.expiryDate = expiryDate || item.expiryDate;
    item.price = price !== undefined ? price : item.price;

    await item.save();
    res.json({ message: "Item updated successfully", item });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ message: "Failed to update item" });
  }
});

// Delete an Item
router.delete("/delete/:id", protect, async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    await item.deleteOne();
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ message: "Failed to delete item" });
  }
});

module.exports = router;