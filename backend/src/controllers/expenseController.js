const Expense = require("../models/expense");

// Create expense
const createExpense = async (req, res) => {
  try {
    const {
      category,
      amount,
      description,
      vendor,
      paymentMethod = "cash",
      expenseDate,
      receiptNumber,
      notes,
    } = req.body;

    if (!category || amount === undefined || !description) {
      return res.status(400).json({
        success: false,
        message: "Category, amount and description are required",
      });
    }

    if (amount < 0) {
      return res.status(400).json({
        success: false,
        message: "Expense amount cannot be negative",
      });
    }

    if (expenseDate && new Date(expenseDate) > new Date()) {
      return res.status(400).json({
        success: false,
        message: "Expense date cannot be in the future",
      });
    }

    const expense = await Expense.create({
      category,
      amount,
      description,
      vendor,
      paymentMethod,
      expenseDate,
      receiptNumber,
      notes,
      createdBy: req.user._id,
    });

    const populatedExpense = await Expense.findById(expense._id).populate(
      "createdBy",
      "name email role"
    );

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: {
        expense: populatedExpense,
      },
    });
  } catch (error) {
    console.error("Create expense error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating expense",
    });
  }
};

// Get all expenses
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ isActive: true })
      .populate("createdBy", "name email role")
      .sort({ expenseDate: -1, createdAt: -1 });

    const totalAmount = expenses.reduce(
      (total, expense) => total + expense.amount,
      0
    );

    res.status(200).json({
      success: true,
      message: "Expenses retrieved successfully",
      count: expenses.length,
      totalAmount,
      data: {
        expenses,
      },
    });
  } catch (error) {
    console.error("Get expenses error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving expenses",
    });
  }
};

// Get single expense
const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      isActive: true,
    }).populate("createdBy", "name email role");

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Expense retrieved successfully",
      data: {
        expense,
      },
    });
  } catch (error) {
    console.error("Get expense error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving expense",
    });
  }
};

// Update expense
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    const allowedFields = [
      "category",
      "amount",
      "description",
      "vendor",
      "paymentMethod",
      "expenseDate",
      "receiptNumber",
      "notes",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        expense[field] = req.body[field];
      }
    });

    if (expense.amount < 0) {
      return res.status(400).json({
        success: false,
        message: "Expense amount cannot be negative",
      });
    }

    if (expense.expenseDate && new Date(expense.expenseDate) > new Date()) {
      return res.status(400).json({
        success: false,
        message: "Expense date cannot be in the future",
      });
    }

    await expense.save();

    const updatedExpense = await Expense.findById(expense._id).populate(
      "createdBy",
      "name email role"
    );

    res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: {
        expense: updatedExpense,
      },
    });
  } catch (error) {
    console.error("Update expense error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating expense",
    });
  }
};

// Get expenses by category
const getExpensesByCategory = async (req, res) => {
  try {
    const expenses = await Expense.find({
      category: req.params.category,
      isActive: true,
    })
      .populate("createdBy", "name email role")
      .sort({ expenseDate: -1 });

    const totalAmount = expenses.reduce(
      (total, expense) => total + expense.amount,
      0
    );

    res.status(200).json({
      success: true,
      message: "Category expenses retrieved successfully",
      category: req.params.category,
      count: expenses.length,
      totalAmount,
      data: {
        expenses,
      },
    });
  } catch (error) {
    console.error("Get category expenses error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving category expenses",
    });
  }
};

// Get expense summary
const getExpenseSummary = async (req, res) => {
  try {
    const summary = await Expense.aggregate([
      {
        $match: {
          isActive: true,
        },
      },
      {
        $group: {
          _id: "$category",
          totalAmount: {
            $sum: "$amount",
          },
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          totalAmount: -1,
        },
      },
    ]);

    const totalExpenses = summary.reduce(
      (total, item) => total + item.totalAmount,
      0
    );

    res.status(200).json({
      success: true,
      message: "Expense summary retrieved successfully",
      totalExpenses,
      data: {
        summary,
      },
    });
  } catch (error) {
    console.error("Expense summary error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving expense summary",
    });
  }
};

// Soft deactivate expense
const deactivateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    expense.isActive = false;

    await expense.save();

    res.status(200).json({
      success: true,
      message: "Expense deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate expense error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deactivating expense",
    });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  getExpensesByCategory,
  getExpenseSummary,
  deactivateExpense,
};