const Inventory = require("../models/inventory");

// Create inventory item
const createInventoryItem = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      manufacturer,
      supplier,
      batchNumber,
      expiryDate,
      purchasePrice,
      sellingPrice,
      quantity = 0,
      unit = "piece",
      reorderLevel = 10,
      location,
      notes,
    } = req.body;

    if (
      !name ||
      !category ||
      purchasePrice === undefined ||
      sellingPrice === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, category, purchase price and selling price are required",
      });
    }

    if (purchasePrice < 0 || sellingPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Purchase price and selling price cannot be negative",
      });
    }

    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity cannot be negative",
      });
    }

    if (reorderLevel < 0) {
      return res.status(400).json({
        success: false,
        message: "Reorder level cannot be negative",
      });
    }

    if (expiryDate && new Date(expiryDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Expiry date cannot be in the past",
      });
    }

    const inventoryItem = await Inventory.create({
      name,
      category,
      description,
      manufacturer,
      supplier,
      batchNumber,
      expiryDate,
      purchasePrice,
      sellingPrice,
      quantity,
      unit,
      reorderLevel,
      location,
      notes,
      createdBy: req.user._id,
    });

    const populatedItem = await Inventory.findById(inventoryItem._id).populate(
      "createdBy",
      "name email role"
    );

    res.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      data: {
        inventoryItem: populatedItem,
      },
    });
  } catch (error) {
    console.error("Create inventory item error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating inventory item",
    });
  }
};

// Get all inventory items
const getInventoryItems = async (req, res) => {
  try {
    const inventoryItems = await Inventory.find({ isActive: true })
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Inventory items retrieved successfully",
      count: inventoryItems.length,
      data: {
        inventoryItems,
      },
    });
  } catch (error) {
    console.error("Get inventory items error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving inventory items",
    });
  }
};

// Get single inventory item
const getInventoryItemById = async (req, res) => {
  try {
    const inventoryItem = await Inventory.findOne({
      _id: req.params.id,
      isActive: true,
    }).populate("createdBy", "name email role");

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Inventory item retrieved successfully",
      data: {
        inventoryItem,
      },
    });
  } catch (error) {
    console.error("Get inventory item error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving inventory item",
    });
  }
};

// Update inventory item
const updateInventoryItem = async (req, res) => {
  try {
    const inventoryItem = await Inventory.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    const allowedFields = [
      "name",
      "category",
      "description",
      "manufacturer",
      "supplier",
      "batchNumber",
      "expiryDate",
      "purchasePrice",
      "sellingPrice",
      "quantity",
      "unit",
      "reorderLevel",
      "location",
      "notes",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        inventoryItem[field] = req.body[field];
      }
    });

    if (inventoryItem.purchasePrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Purchase price cannot be negative",
      });
    }

    if (inventoryItem.sellingPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Selling price cannot be negative",
      });
    }

    if (inventoryItem.quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity cannot be negative",
      });
    }

    if (inventoryItem.reorderLevel < 0) {
      return res.status(400).json({
        success: false,
        message: "Reorder level cannot be negative",
      });
    }

    if (
      inventoryItem.expiryDate &&
      new Date(inventoryItem.expiryDate) < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Expiry date cannot be in the past",
      });
    }

    await inventoryItem.save();

    const updatedItem = await Inventory.findById(inventoryItem._id).populate(
      "createdBy",
      "name email role"
    );

    res.status(200).json({
      success: true,
      message: "Inventory item updated successfully",
      data: {
        inventoryItem: updatedItem,
      },
    });
  } catch (error) {
    console.error("Update inventory item error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating inventory item",
    });
  }
};

// Get low-stock items
const getLowStockItems = async (req, res) => {
  try {
    const inventoryItems = await Inventory.find({
      isActive: true,
      $expr: {
        $lte: ["$quantity", "$reorderLevel"],
      },
    })
      .populate("createdBy", "name email role")
      .sort({ quantity: 1 });

    res.status(200).json({
      success: true,
      message: "Low stock items retrieved successfully",
      count: inventoryItems.length,
      data: {
        inventoryItems,
      },
    });
  } catch (error) {
    console.error("Get low stock items error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving low stock items",
    });
  }
};

// Get expired items
const getExpiredItems = async (req, res) => {
  try {
    const inventoryItems = await Inventory.find({
      isActive: true,
      expiryDate: {
        $lt: new Date(),
      },
    })
      .populate("createdBy", "name email role")
      .sort({ expiryDate: 1 });

    res.status(200).json({
      success: true,
      message: "Expired inventory items retrieved successfully",
      count: inventoryItems.length,
      data: {
        inventoryItems,
      },
    });
  } catch (error) {
    console.error("Get expired items error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving expired inventory items",
    });
  }
};

// Add stock
const addStock = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity === undefined || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "A positive quantity is required",
      });
    }

    const inventoryItem = await Inventory.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    inventoryItem.quantity += quantity;

    await inventoryItem.save();

    res.status(200).json({
      success: true,
      message: "Stock added successfully",
      data: {
        inventoryItem,
      },
    });
  } catch (error) {
    console.error("Add stock error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while adding stock",
    });
  }
};

// Remove stock
const removeStock = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity === undefined || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "A positive quantity is required",
      });
    }

    const inventoryItem = await Inventory.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    if (quantity > inventoryItem.quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock available",
      });
    }

    inventoryItem.quantity -= quantity;

    await inventoryItem.save();

    res.status(200).json({
      success: true,
      message: "Stock removed successfully",
      data: {
        inventoryItem,
      },
    });
  } catch (error) {
    console.error("Remove stock error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while removing stock",
    });
  }
};

// Soft deactivate inventory item
const deactivateInventoryItem = async (req, res) => {
  try {
    const inventoryItem = await Inventory.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    inventoryItem.isActive = false;

    await inventoryItem.save();

    res.status(200).json({
      success: true,
      message: "Inventory item deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate inventory item error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deactivating inventory item",
    });
  }
};

module.exports = {
  createInventoryItem,
  getInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  getLowStockItems,
  getExpiredItems,
  addStock,
  removeStock,
  deactivateInventoryItem,
};