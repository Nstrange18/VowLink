const express = require("express");
const Table = require("../models/Table");
const { protect } = require("../middleware/auth");

const router = express.Router();

// GET all tables for logged in user
router.get("/", protect, async (req, res) => {
  try {
    const tables = await Table.find({ userId: req.user.id }).sort({ createdAt: 1 });
    res.status(200).json(tables);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tables", error: error.message });
  }
});

// POST a new table
router.post("/", protect, async (req, res) => {
  try {
    const { name, shape, capacity, assignedGuests } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Table name is required." });
    }

    const newTable = await Table.create({
      userId: req.user.id,
      name,
      shape: shape || "circle",
      capacity: capacity || 8,
      assignedGuests: assignedGuests || [],
    });

    res.status(201).json({ message: "Table created successfully! ✓", table: newTable });
  } catch (error) {
    res.status(500).json({ message: "Failed to create table", error: error.message });
  }
});

// PUT update a table
router.put("/:id", protect, async (req, res) => {
  try {
    const table = await Table.findOne({ _id: req.params.id, userId: req.user.id });
    if (!table) {
      return res.status(404).json({ message: "Table not found." });
    }

    const { name, shape, capacity, assignedGuests } = req.body;
    if (name !== undefined) table.name = name;
    if (shape !== undefined) table.shape = shape;
    if (capacity !== undefined) table.capacity = capacity;
    if (assignedGuests !== undefined) table.assignedGuests = assignedGuests;

    await table.save();
    res.status(200).json({ message: "Table updated successfully! ✓", table });
  } catch (error) {
    res.status(500).json({ message: "Failed to update table", error: error.message });
  }
});

// DELETE a table
router.delete("/:id", protect, async (req, res) => {
  try {
    const table = await Table.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!table) {
      return res.status(404).json({ message: "Table not found." });
    }

    res.status(200).json({ message: "Table deleted successfully! ✓" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete table", error: error.message });
  }
});

module.exports = router;
