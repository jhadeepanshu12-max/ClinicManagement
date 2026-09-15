const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
      maxlength: 200,
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    manufacturer: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    supplier: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    batchNumber: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    expiryDate: {
      type: Date,
    },

    purchasePrice: {
      type: Number,
      required: [true, "Purchase price is required"],
      min: 0,
    },

    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: 0,
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: 0,
      default: 0,
    },

    unit: {
      type: String,
      required: [true, "Unit is required"],
      trim: true,
      maxlength: 50,
      default: "piece",
    },

    reorderLevel: {
      type: Number,
      min: 0,
      default: 10,
    },

    location: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

inventorySchema.pre("save", async function () {
  if (this.itemCode) {
    return;
  }

  const count = await mongoose.model("Inventory").countDocuments();

  this.itemCode = `INV-ITEM-${String(count + 1).padStart(5, "0")}`;
});

inventorySchema.index({ name: 1 });
inventorySchema.index({ category: 1 });
inventorySchema.index({ expiryDate: 1 });
inventorySchema.index({ quantity: 1 });
inventorySchema.index({ isActive: 1 });

const Inventory = mongoose.model("Inventory", inventorySchema);

module.exports = Inventory;