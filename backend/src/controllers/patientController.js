const Patient = require("../models/patient");

// Create patient
const createPatient = async (req, res) => {
  try {
    const {
      name,
      dateOfBirth,
      gender,
      phone,
      email,
      address,
      bloodGroup,
      emergencyContact,
      medicalHistory,
      allergies,
      notes,
    } = req.body;

    if (!name || !dateOfBirth || !gender || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, date of birth, gender and phone are required",
      });
    }

    const patient = await Patient.create({
      name,
      dateOfBirth,
      gender,
      phone,
      email,
      address,
      bloodGroup,
      emergencyContact,
      medicalHistory,
      allergies,
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Patient created successfully",
      data: {
        patient,
      },
    });
  } catch (error) {
    console.error("Create patient error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating patient",
    });
  }
};

// Get all patients
const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find({ isActive: true })
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Patients retrieved successfully",
      count: patients.length,
      data: {
        patients,
      },
    });
  } catch (error) {
    console.error("Get patients error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving patients",
    });
  }
};

// Get single patient
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate(
      "createdBy",
      "name email role"
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient retrieved successfully",
      data: {
        patient,
      },
    });
  } catch (error) {
    console.error("Get patient error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving patient",
    });
  }
};

// Update patient
const updatePatient = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "dateOfBirth",
      "gender",
      "phone",
      "email",
      "address",
      "bloodGroup",
      "emergencyContact",
      "medicalHistory",
      "allergies",
      "notes",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    ).populate("createdBy", "name email role");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient updated successfully",
      data: {
        patient,
      },
    });
  } catch (error) {
    console.error("Update patient error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating patient",
    });
  }
};

// Deactivate patient
const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient deactivated successfully",
    });
  } catch (error) {
    console.error("Delete patient error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deactivating patient",
    });
  }
};

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
};