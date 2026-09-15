const express = require("express");

const {
  createInventoryItem,
  getInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  getLowStockItems,
  getExpiredItems,
  addStock,
  removeStock,
  deactivateInventoryItem,
} = require("../controllers/inventoryController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// All inventory routes require authentication
router.use(protect);

// Create inventory item
router.post(
  "/",
  authorize("admin", "receptionist"),
  createInventoryItem
);

// Get all inventory items
router.get(
  "/",
  authorize("admin", "doctor", "receptionist"),
  getInventoryItems
);

// Get low-stock items
router.get(
  "/low-stock",
  authorize("admin", "doctor", "receptionist"),
  getLowStockItems
);

// Get expired items
router.get(
  "/expired",
  authorize("admin", "doctor", "receptionist"),
  getExpiredItems
);

// Add stock
router.patch(
  "/:id/add-stock",
  authorize("admin", "receptionist"),
  addStock
);

// Remove stock
router.patch(
  "/:id/remove-stock",
  authorize("admin", "receptionist"),
  removeStock
);

// Get single inventory item
router.get(
  "/:id",
  authorize("admin", "doctor", "receptionist"),
  getInventoryItemById
);

// Update inventory item
router.put(
  "/:id",
  authorize("admin", "receptionist"),
  updateInventoryItem
);

// Soft deactivate inventory item
router.delete(
  "/:id",
  authorize("admin"),
  deactivateInventoryItem
);

module.exports = router;