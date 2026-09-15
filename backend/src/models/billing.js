const mongoose = require("mongoose");

const billingSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      trim: true,
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient is required"],
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Doctor is required"],
    },

    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: [true, "Appointment is required"],
    },

    consultationFee: {
      type: Number,
      required: [true, "Consultation fee is required"],
      min: 0,
    },

    additionalCharges: {
      type: Number,
      default: 0,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    tax: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid", "refunded"],
      default: "pending",
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "bank-transfer", "other"],
      default: "cash",
    },

    paymentDate: {
      type: Date,
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

billingSchema.pre("save", async function () {
  if (this.invoiceNumber) {
    return;
  }

  const count = await mongoose.model("Billing").countDocuments();

  this.invoiceNumber = `INV-${String(count + 1).padStart(5, "0")}`;
});

billingSchema.index({ patient: 1, createdAt: -1 });
billingSchema.index({ doctor: 1, createdAt: -1 });
billingSchema.index({ appointment: 1 });
billingSchema.index({ paymentStatus: 1 });

const Billing = mongoose.model("Billing", billingSchema);

module.exports = Billing;