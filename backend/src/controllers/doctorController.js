const Doctor = require("../models/doctor");
const User = require("../models/user");


// Create doctor
const createDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      specialization,
      qualification,
      licenseNumber,
      experience,
      consultationFee,
      availableDays,
      availability,
      department,
      bio,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !specialization ||
      !qualification ||
      !licenseNumber ||
      experience === undefined ||
      consultationFee === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, password, specialization, qualification, license number, experience and consultation fee are required",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    const existingDoctor = await Doctor.findOne({
      licenseNumber,
    });

    if (existingDoctor) {
      return res.status(409).json({
        success: false,
        message: "A doctor with this license number already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: "doctor",
    });

    try {
      const doctor = await Doctor.create({
        user: user._id,
        specialization,
        qualification,
        licenseNumber,
        experience,
        consultationFee,
        availableDays,
        availability,
        department,
        bio,
      });

      const populatedDoctor = await Doctor.findById(doctor._id).populate(
        "user",
        "name email phone role isActive"
      );

      res.status(201).json({
        success: true,
        message: "Doctor created successfully",
        data: {
          doctor: populatedDoctor,
        },
      });
    } catch (doctorError) {
      await User.findByIdAndDelete(user._id);
      throw doctorError;
    }
  } catch (error) {
    console.error("Create doctor error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating doctor",
    });
  }
};

// Get all doctors
const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ isActive: true })
      .populate("user", "name email phone role isActive")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Doctors retrieved successfully",
      count: doctors.length,
      data: {
        doctors,
      },
    });
  } catch (error) {
    console.error("Get doctors error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving doctors",
    });
  }
};

// Get single doctor
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate(
      "user",
      "name email phone role isActive"
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Doctor retrieved successfully",
      data: {
        doctor,
      },
    });
  } catch (error) {
    console.error("Get doctor error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving doctor",
    });
  }
};

// Update doctor
const updateDoctor = async (req, res) => {
  try {
    const {
      name,
      phone,
      specialization,
      qualification,
      licenseNumber,
      experience,
      consultationFee,
      availableDays,
      availability,
      department,
      bio,
    } = req.body;

    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    if (licenseNumber && licenseNumber !== doctor.licenseNumber) {
      const existingDoctor = await Doctor.findOne({
        licenseNumber,
        _id: { $ne: doctor._id },
      });

      if (existingDoctor) {
        return res.status(409).json({
          success: false,
          message: "A doctor with this license number already exists",
        });
      }
    }

    const doctorFields = {
      specialization,
      qualification,
      licenseNumber,
      experience,
      consultationFee,
      availableDays,
      availability,
      department,
      bio,
    };

    Object.keys(doctorFields).forEach((field) => {
      if (doctorFields[field] !== undefined) {
        doctor[field] = doctorFields[field];
      }
    });

    await doctor.save();

    if (name !== undefined || phone !== undefined) {
      const userUpdates = {};

      if (name !== undefined) {
        userUpdates.name = name;
      }

      if (phone !== undefined) {
        userUpdates.phone = phone;
      }

      await User.findByIdAndUpdate(doctor.user, userUpdates, {
        runValidators: true,
      });
    }

    const updatedDoctor = await Doctor.findById(doctor._id).populate(
      "user",
      "name email phone role isActive"
    );

    res.status(200).json({
      success: true,
      message: "Doctor updated successfully",
      data: {
        doctor: updatedDoctor,
      },
    });
  } catch (error) {
    console.error("Update doctor error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating doctor",
    });
  }
};

// Deactivate doctor
const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    doctor.isActive = false;
    await doctor.save();

    await User.findByIdAndUpdate(doctor.user, {
      isActive: false,
    });

    res.status(200).json({
      success: true,
      message: "Doctor deactivated successfully",
    });
  } catch (error) {
    console.error("Delete doctor error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deactivating doctor",
    });
  }
};

module.exports = {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
};