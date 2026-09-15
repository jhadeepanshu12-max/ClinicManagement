const Appointment = require("../models/appointment");
const Patient = require("../models/patient");
const Doctor = require("../models/doctor");

// Create appointment
const createAppointment = async (req, res) => {
  try {
    const {
      patient,
      doctor,
      appointmentDate,
      appointmentTime,
      reason,
      consultationFee,
      notes,
    } = req.body;

    if (
      !patient ||
      !doctor ||
      !appointmentDate ||
      !appointmentTime ||
      !reason
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Patient, doctor, appointment date, appointment time and reason are required",
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

    // Prevent double booking for the same doctor
    const existingAppointment = await Appointment.findOne({
      doctor,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: {
        $in: ["scheduled", "confirmed"],
      },
    });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: "This doctor already has an appointment at this time",
      });
    }

    const appointment = await Appointment.create({
      patient,
      doctor,
      appointmentDate,
      appointmentTime,
      reason,
      consultationFee:
        consultationFee !== undefined
          ? consultationFee
          : existingDoctor.consultationFee,
      notes,
      createdBy: req.user._id,
    });

    const populatedAppointment = await Appointment.findById(
      appointment._id
    )
      .populate("patient", "patientId name phone email gender")
      .populate(
        {
          path: "doctor",
          populate: {
            path: "user",
            select: "name email phone role",
          },
        }
      )
      .populate("createdBy", "name email role");

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: {
        appointment: populatedAppointment,
      },
    });
  } catch (error) {
    console.error("Create appointment error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating appointment",
    });
  }
};

// Get all appointments
const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("patient", "patientId name phone email gender")
      .populate({
        path: "doctor",
        populate: {
          path: "user",
          select: "name email phone role",
        },
      })
      .populate("createdBy", "name email role")
      .sort({
        appointmentDate: 1,
        appointmentTime: 1,
      });

    res.status(200).json({
      success: true,
      message: "Appointments retrieved successfully",
      count: appointments.length,
      data: {
        appointments,
      },
    });
  } catch (error) {
    console.error("Get appointments error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving appointments",
    });
  }
};

// Get single appointment
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patient", "patientId name phone email gender")
      .populate({
        path: "doctor",
        populate: {
          path: "user",
          select: "name email phone role",
        },
      })
      .populate("createdBy", "name email role");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Appointment retrieved successfully",
      data: {
        appointment,
      },
    });
  } catch (error) {
    console.error("Get appointment error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving appointment",
    });
  }
};

// Update appointment
const updateAppointment = async (req, res) => {
  try {
    const {
      appointmentDate,
      appointmentTime,
      reason,
      status,
      consultationFee,
      notes,
    } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check for double booking when date/time changes
    if (
      (appointmentDate !== undefined &&
        new Date(appointmentDate).getTime() !==
          new Date(appointment.appointmentDate).getTime()) ||
      (appointmentTime !== undefined &&
        appointmentTime !== appointment.appointmentTime)
    ) {
      const newDate =
        appointmentDate !== undefined
          ? new Date(appointmentDate)
          : appointment.appointmentDate;

      const newTime =
        appointmentTime !== undefined
          ? appointmentTime
          : appointment.appointmentTime;

      const existingAppointment = await Appointment.findOne({
        _id: { $ne: appointment._id },
        doctor: appointment.doctor,
        appointmentDate: newDate,
        appointmentTime: newTime,
        status: {
          $in: ["scheduled", "confirmed"],
        },
      });

      if (existingAppointment) {
        return res.status(409).json({
          success: false,
          message: "This doctor already has an appointment at this time",
        });
      }
    }

    const updates = {
      appointmentDate,
      appointmentTime,
      reason,
      status,
      consultationFee,
      notes,
    };

    Object.keys(updates).forEach((field) => {
      if (updates[field] !== undefined) {
        appointment[field] = updates[field];
      }
    });

    await appointment.save();

    const updatedAppointment = await Appointment.findById(
      appointment._id
    )
      .populate("patient", "patientId name phone email gender")
      .populate({
        path: "doctor",
        populate: {
          path: "user",
          select: "name email phone role",
        },
      })
      .populate("createdBy", "name email role");

    res.status(200).json({
      success: true,
      message: "Appointment updated successfully",
      data: {
        appointment: updatedAppointment,
      },
    });
  } catch (error) {
    console.error("Update appointment error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating appointment",
    });
  }
};

// Cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Completed appointment cannot be cancelled",
      });
    }

    appointment.status = "cancelled";
    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      data: {
        appointment,
      },
    });
  } catch (error) {
    console.error("Cancel appointment error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while cancelling appointment",
    });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
};