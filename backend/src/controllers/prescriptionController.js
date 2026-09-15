const Prescription = require("../models/prescription");
const Patient = require("../models/patient");
const Doctor = require("../models/doctor");
const Appointment = require("../models/appointment");
const MedicalRecord = require("../models/medicalRecord");

// Create prescription
const createPrescription = async (req, res) => {
  try {
    const {
      patient,
      doctor,
      appointment,
      medicalRecord,
      prescriptionDate,
      medicines,
      generalInstructions,
      advice,
      followUpDate,
    } = req.body;

    if (
      !patient ||
      !doctor ||
      !appointment ||
      !medicalRecord ||
      !medicines ||
      medicines.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Patient, doctor, appointment, medical record and at least one medicine are required",
      });
    }

    // Check patient
    const existingPatient = await Patient.findOne({
      _id: patient,
      isActive: true,
    });

    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        message: "Active patient not found",
      });
    }

    // Check doctor
    const existingDoctor = await Doctor.findOne({
      _id: doctor,
      isActive: true,
    });

    if (!existingDoctor) {
      return res.status(404).json({
        success: false,
        message: "Active doctor not found",
      });
    }

    // Check appointment
    const existingAppointment = await Appointment.findById(appointment);

    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check appointment relationship
    if (
      existingAppointment.patient.toString() !== patient ||
      existingAppointment.doctor.toString() !== doctor
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Appointment does not belong to the selected patient and doctor",
      });
    }

    // Check medical record
    const existingMedicalRecord = await MedicalRecord.findById(
      medicalRecord
    );

    if (!existingMedicalRecord) {
      return res.status(404).json({
        success: false,
        message: "Medical record not found",
      });
    }

    // Check medical record relationship
    if (
      existingMedicalRecord.patient.toString() !== patient ||
      existingMedicalRecord.doctor.toString() !== doctor ||
      existingMedicalRecord.appointment.toString() !== appointment
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Medical record does not belong to the selected patient, doctor and appointment",
      });
    }

    // Prevent duplicate prescription for same appointment
    const existingPrescription = await Prescription.findOne({
      appointment,
      isActive: true,
    });

    if (existingPrescription) {
      return res.status(409).json({
        success: false,
        message: "An active prescription already exists for this appointment",
      });
    }

    const prescription = await Prescription.create({
      patient,
      doctor,
      appointment,
      medicalRecord,
      prescriptionDate,
      medicines,
      generalInstructions,
      advice,
      followUpDate,
      createdBy: req.user._id,
    });

    const populatedPrescription = await Prescription.findById(
      prescription._id
    )
      .populate(
        "patient",
        "patientId name phone email gender bloodGroup"
      )
      .populate({
        path: "doctor",
        populate: {
          path: "user",
          select: "name email phone role",
        },
      })
      .populate(
        "appointment",
        "appointmentDate appointmentTime reason status consultationFee"
      )
      .populate(
        "medicalRecord",
        "visitDate chiefComplaint diagnosis treatmentPlan"
      )
      .populate("createdBy", "name email role");

    res.status(201).json({
      success: true,
      message: "Prescription created successfully",
      data: {
        prescription: populatedPrescription,
      },
    });
  } catch (error) {
    console.error("Create prescription error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating prescription",
    });
  }
};

// Get all prescriptions
const getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({
      isActive: true,
    })
      .populate(
        "patient",
        "patientId name phone email gender bloodGroup"
      )
      .populate({
        path: "doctor",
        populate: {
          path: "user",
          select: "name email phone role",
        },
      })
      .populate(
        "appointment",
        "appointmentDate appointmentTime reason status consultationFee"
      )
      .populate(
        "medicalRecord",
        "visitDate chiefComplaint diagnosis treatmentPlan"
      )
      .populate("createdBy", "name email role")
      .sort({ prescriptionDate: -1 });

    res.status(200).json({
      success: true,
      message: "Prescriptions retrieved successfully",
      count: prescriptions.length,
      data: {
        prescriptions,
      },
    });
  } catch (error) {
    console.error("Get prescriptions error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving prescriptions",
    });
  }
};

// Get single prescription
const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate(
        "patient",
        "patientId name phone email gender bloodGroup"
      )
      .populate({
        path: "doctor",
        populate: {
          path: "user",
          select: "name email phone role",
        },
      })
      .populate(
        "appointment",
        "appointmentDate appointmentTime reason status consultationFee"
      )
      .populate(
        "medicalRecord",
        "visitDate chiefComplaint diagnosis treatmentPlan"
      )
      .populate("createdBy", "name email role");

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Prescription retrieved successfully",
      data: {
        prescription,
      },
    });
  } catch (error) {
    console.error("Get prescription error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving prescription",
    });
  }
};

// Get patient prescription history
const getPatientPrescriptionHistory = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      _id: req.params.patientId,
      isActive: true,
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Active patient not found",
      });
    }

    const prescriptions = await Prescription.find({
      patient: req.params.patientId,
      isActive: true,
    })
      .populate({
        path: "doctor",
        populate: {
          path: "user",
          select: "name email phone role",
        },
      })
      .populate(
        "appointment",
        "appointmentDate appointmentTime reason status"
      )
      .populate(
        "medicalRecord",
        "visitDate diagnosis treatmentPlan"
      )
      .sort({ prescriptionDate: -1 });

    res.status(200).json({
      success: true,
      message: "Patient prescription history retrieved successfully",
      count: prescriptions.length,
      data: {
        patient: {
          id: patient._id,
          patientId: patient.patientId,
          name: patient.name,
          phone: patient.phone,
          email: patient.email,
          gender: patient.gender,
          bloodGroup: patient.bloodGroup,
        },
        prescriptions,
      },
    });
  } catch (error) {
    console.error(
      "Get patient prescription history error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while retrieving patient prescription history",
    });
  }
};

// Update prescription
const updatePrescription = async (req, res) => {
  try {
    const {
      prescriptionDate,
      medicines,
      generalInstructions,
      advice,
      followUpDate,
    } = req.body;

    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    if (medicines !== undefined && medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Prescription must contain at least one medicine",
      });
    }

    const updates = {
      prescriptionDate,
      medicines,
      generalInstructions,
      advice,
      followUpDate,
    };

    Object.keys(updates).forEach((field) => {
      if (updates[field] !== undefined) {
        prescription[field] = updates[field];
      }
    });

    await prescription.save();

    const updatedPrescription = await Prescription.findById(
      prescription._id
    )
      .populate(
        "patient",
        "patientId name phone email gender bloodGroup"
      )
      .populate({
        path: "doctor",
        populate: {
          path: "user",
          select: "name email phone role",
        },
      })
      .populate(
        "appointment",
        "appointmentDate appointmentTime reason status consultationFee"
      )
      .populate(
        "medicalRecord",
        "visitDate chiefComplaint diagnosis treatmentPlan"
      )
      .populate("createdBy", "name email role");

    res.status(200).json({
      success: true,
      message: "Prescription updated successfully",
      data: {
        prescription: updatedPrescription,
      },
    });
  } catch (error) {
    console.error("Update prescription error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating prescription",
    });
  }
};

// Deactivate prescription
const deletePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    prescription.isActive = false;
    await prescription.save();

    res.status(200).json({
      success: true,
      message: "Prescription deactivated successfully",
    });
  } catch (error) {
    console.error("Delete prescription error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deactivating prescription",
    });
  }
};

module.exports = {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  getPatientPrescriptionHistory,
  updatePrescription,
  deletePrescription,
};