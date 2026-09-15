const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    expenseNumber: {
      type: String,
      unique: true,
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Expense category is required"],
      trim: true,
      enum: [
        "rent",
        "salary",
        "utilities",
        "medical-supplies",
        "equipment",
        "maintenance",
        "marketing",
        "transport",
        "office-supplies",
        "other",
      ],
    },

    amount: {
      type: Number,
      required: [true, "Expense amount is required"],
      min: 0,
    },

    description: {
      type: String,
      required: [true, "Expense description is required"],
      trim: true,
      maxlength: 1000,
    },

    vendor: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "bank-transfer", "other"],
      default: "cash",
    },

    expenseDate: {
      type: Date,
      required: [true, "Expense date is required"],
      default: Date.now,
    },

    receiptNumber: {
      type: String,
      trim: true,
      maxlength: 100,
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

expenseSchema.pre("save", async function () {
  if (this.expenseNumber) {
    return;
  }

  const count = await mongoose.model("Expense").countDocuments();

  this.expenseNumber = `EXP-${String(count + 1).padStart(5, "0")}`;
});

expenseSchema.index({ category: 1 });
expenseSchema.index({ expenseDate: -1 });
expenseSchema.index({ createdBy: 1 });
expenseSchema.index({ isActive: 1 });

const Expense = mongoose.model("Expense", expenseSchema);

module.exports = Expense;