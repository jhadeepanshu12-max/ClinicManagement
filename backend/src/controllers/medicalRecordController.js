const MedicalRecord = require("../models/medicalRecord");
const Patient = require("../models/patient");
const Doctor = require("../models/doctor");
const Appointment = require("../models/appointment");

// Create medical record
const createMedicalRecord = async (req, res) => {
  try {
    const {
      patient,
      doctor,
      appointment,
      visitDate,
      chiefComplaint,
      symptoms,
      vitals,
      diagnosis,
      treatmentPlan,
      clinicalNotes,
      followUpDate,
      followUpNotes,
    } = req.body;

    if (
      !patient ||
      !doctor ||
      !appointment ||
      !chiefComplaint ||
      !diagnosis
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Patient, doctor, appointment, chief complaint and diagnosis are required",
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

    // Make sure appointment belongs to patient and doctor
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

    // Prevent duplicate medical record for same appointment
    const existingRecord = await MedicalRecord.findOne({
      appointment,
    });

    if (existingRecord) {
      return res.status(409).json({
        success: false,
        message: "A medical record already exists for this appointment",
      });
    }

    const medicalRecord = await MedicalRecord.create({
      patient,
      doctor,
      appointment,
      visitDate,
      chiefComplaint,
      symptoms,
      vitals,
      diagnosis,
      treatmentPlan,
      clinicalNotes,
      followUpDate,
      followUpNotes,
      createdBy: req.user._id,
    });

    // Automatically mark appointment as completed
    existingAppointment.status = "completed";
    await existingAppointment.save();

    const populatedRecord = await MedicalRecord.findById(
      medicalRecord._id
    )
      .populate("patient", "patientId name phone email gender bloodGroup")
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
      .populate("createdBy", "name email role");

    res.status(201).json({
      success: true,
      message: "Medical record created successfully",
      data: {
        medicalRecord: populatedRecord,
      },
    });
  } catch (error) {
    console.error("Create medical record error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating medical record",
    });
  }
};

// Get all medical records
const getMedicalRecords = async (req, res) => {
  try {
    const medicalRecords = await MedicalRecord.find({
      isActive: true,
    })
      .populate("patient", "patientId name phone email gender bloodGroup")
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
      .populate("createdBy", "name email role")
      .sort({ visitDate: -1 });

    res.status(200).json({
      success: true,
      message: "Medical records retrieved successfully",
      count: medicalRecords.length,
      data: {
        medicalRecords,
      },
    });
  } catch (error) {
    console.error("Get medical records error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving medical records",
    });
  }
};

// Get medical record by ID
const getMedicalRecordById = async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findById(req.params.id)
      .populate("patient", "patientId name phone email gender bloodGroup")
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
      .populate("createdBy", "name email role");

    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: "Medical record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Medical record retrieved successfully",
      data: {
        medicalRecord,
      },
    });
  } catch (error) {
    console.error("Get medical record error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving medical record",
    });
  }
};

// Get patient medical history
const getPatientMedicalHistory = async (req, res) => {
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

    const medicalRecords = await MedicalRecord.find({
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
        "appointmentDate appointmentTime reason status consultationFee"
      )
      .sort({ visitDate: -1 });

    res.status(200).json({
      success: true,
      message: "Patient medical history retrieved successfully",
      count: medicalRecords.length,
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
        medicalRecords,
      },
    });
  } catch (error) {
    console.error("Get patient medical history error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving patient medical history",
    });
  }
};

// Update medical record
const updateMedicalRecord = async (req, res) => {
  try {
    const {
      visitDate,
      chiefComplaint,
      symptoms,
      vitals,
      diagnosis,
      treatmentPlan,
      clinicalNotes,
      followUpDate,
      followUpNotes,
    } = req.body;

    const medicalRecord = await MedicalRecord.findById(req.params.id);

    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: "Medical record not found",
      });
    }

    const updates = {
      visitDate,
      chiefComplaint,
      symptoms,
      vitals,
      diagnosis,
      treatmentPlan,
      clinicalNotes,
      followUpDate,
      followUpNotes,
    };

    Object.keys(updates).forEach((field) => {
      if (updates[field] !== undefined) {
        medicalRecord[field] = updates[field];
      }
    });

    await medicalRecord.save();

    const updatedRecord = await MedicalRecord.findById(
      medicalRecord._id
    )
      .populate("patient", "patientId name phone email gender bloodGroup")
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
      .populate("createdBy", "name email role");

    res.status(200).json({
      success: true,
      message: "Medical record updated successfully",
      data: {
        medicalRecord: updatedRecord,
      },
    });
  } catch (error) {
    console.error("Update medical record error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating medical record",
    });
  }
};

module.exports = {
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecordById,
  getPatientMedicalHistory,
  updateMedicalRecord,
};