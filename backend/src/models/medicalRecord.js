const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema(
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

    visitDate: {
      type: Date,
      required: [true, "Visit date is required"],
      default: Date.now,
    },

    chiefComplaint: {
      type: String,
      required: [true, "Chief complaint is required"],
      trim: true,
      maxlength: 1000,
    },

    symptoms: {
      type: [String],
      default: [],
    },

    vitals: {
      temperature: {
        type: Number,
        min: 0,
      },

      bloodPressure: {
        type: String,
        trim: true,
      },

      heartRate: {
        type: Number,
        min: 0,
      },

      respiratoryRate: {
        type: Number,
        min: 0,
      },

      oxygenSaturation: {
        type: Number,
        min: 0,
        max: 100,
      },

      weight: {
        type: Number,
        min: 0,
      },

      height: {
        type: Number,
        min: 0,
      },
    },

    diagnosis: {
      type: String,
      required: [true, "Diagnosis is required"],
      trim: true,
      maxlength: 2000,
    },

    treatmentPlan: {
      type: String,
      trim: true,
      maxlength: 3000,
    },

    clinicalNotes: {
      type: String,
      trim: true,
      maxlength: 5000,
    },

    followUpDate: {
      type: Date,
    },

    followUpNotes: {
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

// Useful indexes for EMR queries
medicalRecordSchema.index({ patient: 1, visitDate: -1 });
medicalRecordSchema.index({ doctor: 1, visitDate: -1 });
medicalRecordSchema.index({ appointment: 1 });

const MedicalRecord = mongoose.model(
  "MedicalRecord",
  medicalRecordSchema
);

module.exports = MedicalRecord;