const Patient = require("../models/patient");
const Appointment = require("../models/appointment");
const MedicalRecord = require("../models/medicalRecord");
const Prescription = require("../models/prescription");
const Billing = require("../models/billing");

const getPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      user: req.user._id,
      isActive: true,
    }).populate("user", "name email phone role");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error("Patient profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching patient profile.",
    });
  }
};

const getMyAppointments = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      user: req.user._id,
      isActive: true,
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found.",
      });
    }

    const appointments = await Appointment.find({
      patient: patient._id,
    })
      .populate("doctor", "name specialization qualification")
      .sort({ appointmentDate: -1, appointmentTime: -1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error("Patient appointments error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching appointments.",
    });
  }
};

const getMyMedicalRecords = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      user: req.user._id,
      isActive: true,
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found.",
      });
    }

    const records = await MedicalRecord.find({
      patient: patient._id,
    })
      .populate("doctor", "name specialization qualification")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error("Patient medical records error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching medical records.",
    });
  }
};

const getMyPrescriptions = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      user: req.user._id,
      isActive: true,
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found.",
      });
    }

    const prescriptions = await Prescription.find({
      patient: patient._id,
    })
      .populate("doctor", "name specialization qualification")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    console.error("Patient prescriptions error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching prescriptions.",
    });
  }
};

const getMyBills = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      user: req.user._id,
      isActive: true,
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found.",
      });
    }

    const bills = await Billing.find({
      patient: patient._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bills.length,
      data: bills,
    });
  } catch (error) {
    console.error("Patient billing error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching bills.",
    });
  }
};

const getPatientDashboard = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      user: req.user._id,
      isActive: true,
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found.",
      });
    }

    const [
      totalAppointments,
      upcomingAppointments,
      medicalRecords,
      prescriptions,
      bills,
    ] = await Promise.all([
      Appointment.countDocuments({
        patient: patient._id,
      }),

      Appointment.countDocuments({
        patient: patient._id,
        status: {
          $in: ["scheduled", "confirmed"],
        },
      }),

      MedicalRecord.countDocuments({
        patient: patient._id,
      }),

      Prescription.countDocuments({
        patient: patient._id,
      }),

      Billing.countDocuments({
        patient: patient._id,
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        patient: {
          id: patient._id,
          patientId: patient.patientId,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
        },
        statistics: {
          totalAppointments,
          upcomingAppointments,
          medicalRecords,
          prescriptions,
          bills,
        },
      },
    });
  } catch (error) {
    console.error("Patient dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching patient dashboard.",
    });
  }
};

module.exports = {
  getPatientProfile,
  getMyAppointments,
  getMyMedicalRecords,
  getMyPrescriptions,
  getMyBills,
  getPatientDashboard,
};