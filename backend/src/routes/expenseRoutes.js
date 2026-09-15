const express = require("express");

const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  getExpensesByCategory,
  getExpenseSummary,
  deactivateExpense,
} = require("../controllers/expenseController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// All expense routes require authentication
router.use(protect);

// Create expense
router.post(
  "/",
  authorize("admin", "receptionist"),
  createExpense
);

// Get all expenses
router.get(
  "/",
  authorize("admin", "doctor", "receptionist"),
  getExpenses
);

// Get expense summary
router.get(
  "/summary",
  authorize("admin", "doctor", "receptionist"),
  getExpenseSummary
);

// Get expenses by category
router.get(
  "/category/:category",
  authorize("admin", "doctor", "receptionist"),
  getExpensesByCategory
);

// Get single expense
router.get(
  "/:id",
  authorize("admin", "doctor", "receptionist"),
  getExpenseById
);

// Update expense
router.put(
  "/:id",
  authorize("admin", "receptionist"),
  updateExpense
);

// Soft deactivate expense
router.delete(
  "/:id",
  authorize("admin"),
  deactivateExpense
);

module.exports = router;