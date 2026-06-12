const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    shape: {
      type: String,
      enum: ["circle", "rectangle"],
      default: "circle",
    },
    capacity: {
      type: Number,
      default: 8,
      min: 2,
      max: 20,
    },
    assignedGuests: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Table", tableSchema);
