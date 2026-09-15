const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Medicine name is required"],
      trim: true,
      maxlength: 200,
    },

    dosage: {
      type: String,
      required: [true, "Medicine dosage is required"],
      trim: true,
      maxlength: 100,
    },

    frequency: {
      type: String,
      required: [true, "Medicine frequency is required"],
      trim: true,
      maxlength: 100,
    },

    duration: {
      type: String,
      required: [true, "Medicine duration is required"],
      trim: true,
      maxlength: 100,
    },

    route: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "Oral",
    },

    instructions: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    _id: false,
  }
);

const prescriptionSchema = new mongoose.Schema(
  {
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

    medicalRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalRecord",
      required: [true, "Medical record is required"],
    },

    prescriptionDate: {
      type: Date,
      required: [true, "Prescription date is required"],
      default: Date.now,
    },

    medicines: {
      type: [medicineSchema],
      required: [true, "At least one medicine is required"],
      validate: {
        validator: function (medicines) {
          return medicines.length > 0;
        },
        message: "Prescription must contain at least one medicine",
      },
    },

    generalInstructions: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    advice: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    followUpDate: {
      type: Date,
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

// Useful indexes
prescriptionSchema.index({ patient: 1, prescriptionDate: -1 });
prescriptionSchema.index({ doctor: 1, prescriptionDate: -1 });
prescriptionSchema.index({ appointment: 1 });

const Prescription = mongoose.model(
  "Prescription",
  prescriptionSchema
);

module.exports = Prescription;