const Doctor = require("../models/doctor");
const User = require("../models/user");


// ======================================================
// CREATE DOCTOR
// ======================================================

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

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    const existingDoctor = await Doctor.findOne({
      licenseNumber: licenseNumber.trim(),
    });

    if (existingDoctor) {
      return res.status(409).json({
        success: false,
        message:
          "A doctor with this license number already exists",
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || undefined,
      password,
      role: "doctor",
      isActive: true,
    });

    try {
      const doctor = await Doctor.create({
        user: user._id,
        specialization: specialization.trim(),
        qualification: qualification.trim(),
        licenseNumber: licenseNumber.trim(),
        experience: Number(experience),
        consultationFee: Number(consultationFee),
        availableDays: Array.isArray(availableDays)
          ? availableDays
          : [],
        availability: availability || {
          startTime: "",
          endTime: "",
        },
        department: department?.trim() || "",
        bio: bio?.trim() || "",
        isActive: true,
      });

      const populatedDoctor =
        await Doctor.findById(doctor._id).populate(
          "user",
          "name email phone role isActive"
        );

      return res.status(201).json({
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

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A doctor or user with the provided unique value already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while creating doctor",
    });
  }
};


// ======================================================
// GET ALL DOCTORS
// ======================================================

const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({})
      .populate(
        "user",
        "name email phone role isActive"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Doctors retrieved successfully",
      count: doctors.length,
      data: {
        doctors,
      },
    });
  } catch (error) {
    console.error("Get doctors error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Server error while retrieving doctors",
    });
  }
};


// ======================================================
// GET SINGLE DOCTOR
// ======================================================

const getDoctorById = async (req, res) => {
  try {
    const doctor =
      await Doctor.findById(req.params.id).populate(
        "user",
        "name email phone role isActive"
      );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor retrieved successfully",
      data: {
        doctor,
      },
    });
  } catch (error) {
    console.error("Get doctor error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while retrieving doctor",
    });
  }
};


// ======================================================
// UPDATE DOCTOR
// ======================================================

const updateDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
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
      isActive,
    } = req.body;

    const doctor =
      await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }


    // ----------------------------------------------
    // Check license uniqueness
    // ----------------------------------------------

    if (
      licenseNumber !== undefined &&
      licenseNumber.trim() !==
        doctor.licenseNumber
    ) {
      const existingDoctor =
        await Doctor.findOne({
          licenseNumber:
            licenseNumber.trim(),
          _id: {
            $ne: doctor._id,
          },
        });

      if (existingDoctor) {
        return res.status(409).json({
          success: false,
          message:
            "A doctor with this license number already exists",
        });
      }
    }


    // ----------------------------------------------
    // Update doctor fields
    // ----------------------------------------------

    const doctorFields = {
      specialization:
        specialization !== undefined
          ? specialization.trim()
          : undefined,

      qualification:
        qualification !== undefined
          ? qualification.trim()
          : undefined,

      licenseNumber:
        licenseNumber !== undefined
          ? licenseNumber.trim()
          : undefined,

      experience:
        experience !== undefined
          ? Number(experience)
          : undefined,

      consultationFee:
        consultationFee !== undefined
          ? Number(consultationFee)
          : undefined,

      availableDays:
        availableDays !== undefined
          ? Array.isArray(availableDays)
            ? availableDays
            : []
          : undefined,

      availability:
        availability !== undefined
          ? availability
          : undefined,

      department:
        department !== undefined
          ? department.trim()
          : undefined,

      bio:
        bio !== undefined
          ? bio.trim()
          : undefined,

      isActive:
        isActive !== undefined
          ? Boolean(isActive)
          : undefined,
    };


    Object.keys(doctorFields).forEach(
      (field) => {
        if (
          doctorFields[field] !==
          undefined
        ) {
          doctor[field] =
            doctorFields[field];
        }
      }
    );

    await doctor.save();


    // ----------------------------------------------
    // Update linked User
    // ----------------------------------------------

    const userUpdates = {};

    if (name !== undefined) {
      userUpdates.name =
        name.trim();
    }

    if (email !== undefined) {
      const normalizedEmail =
        email.trim().toLowerCase();

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
          _id: {
            $ne: doctor.user,
          },
        });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message:
            "Another user already uses this email",
        });
      }

      userUpdates.email =
        normalizedEmail;
    }

    if (phone !== undefined) {
      userUpdates.phone =
        phone.trim();
    }

    if (
      isActive !== undefined
    ) {
      userUpdates.isActive =
        Boolean(isActive);
    }


    if (
      Object.keys(userUpdates)
        .length > 0
    ) {
      await User.findByIdAndUpdate(
        doctor.user,
        userUpdates,
        {
          runValidators: true,
        }
      );
    }


    // ----------------------------------------------
    // Return updated doctor
    // ----------------------------------------------

    const updatedDoctor =
      await Doctor.findById(
        doctor._id
      ).populate(
        "user",
        "name email phone role isActive"
      );

    return res.status(200).json({
      success: true,
      message:
        "Doctor updated successfully",
      data: {
        doctor: updatedDoctor,
      },
    });
  } catch (error) {
    console.error(
      "Update doctor error:",
      error
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A user or doctor with the provided unique value already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating doctor",
    });
  }
};


// ======================================================
// DEACTIVATE DOCTOR
// ======================================================

const deleteDoctor = async (req, res) => {
  try {
    const doctor =
      await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    doctor.isActive = false;

    await doctor.save();

    await User.findByIdAndUpdate(
      doctor.user,
      {
        isActive: false,
      },
      {
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message:
        "Doctor deactivated successfully",
      data: {
        doctorId: doctor._id,
        isActive: false,
      },
    });
  } catch (error) {
    console.error(
      "Delete doctor error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while deactivating doctor",
    });
  }
};


// ======================================================
// REACTIVATE DOCTOR
// ======================================================

const restoreDoctor = async (req, res) => {
  try {
    const doctor =
      await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    doctor.isActive = true;

    await doctor.save();

    await User.findByIdAndUpdate(
      doctor.user,
      {
        isActive: true,
      },
      {
        runValidators: true,
      }
    );

    const restoredDoctor =
      await Doctor.findById(
        doctor._id
      ).populate(
        "user",
        "name email phone role isActive"
      );

    return res.status(200).json({
      success: true,
      message:
        "Doctor reactivated successfully",
      data: {
        doctor: restoredDoctor,
      },
    });
  } catch (error) {
    console.error(
      "Restore doctor error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while reactivating doctor",
    });
  }
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  restoreDoctor,
};