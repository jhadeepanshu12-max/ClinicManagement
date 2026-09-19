const Doctor = require("../models/doctor");
const User = require("../models/user");

// GET CURRENT DOCTOR PROFILE
const getMyProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      user: req.user._id,
    }).populate(
      "user",
      "name email phone role isActive"
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor profile retrieved successfully",
      data: {
        doctor,
      },
    });
  } catch (error) {
    console.error("Get doctor profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while retrieving doctor profile",
    });
  }
};

// UPDATE CURRENT DOCTOR PROFILE
const updateMyProfile = async (req, res) => {
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
    } = req.body;

    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    // Check license number uniqueness
    if (
      licenseNumber !== undefined &&
      licenseNumber.trim() !== doctor.licenseNumber
    ) {
      const existingDoctor = await Doctor.findOne({
        licenseNumber: licenseNumber.trim(),
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

    // Update doctor profile fields
    if (specialization !== undefined) {
      doctor.specialization =
        specialization.trim();
    }

    if (qualification !== undefined) {
      doctor.qualification =
        qualification.trim();
    }

    if (licenseNumber !== undefined) {
      doctor.licenseNumber =
        licenseNumber.trim();
    }

    if (experience !== undefined) {
      const numericExperience =
        Number(experience);

      if (
        Number.isNaN(numericExperience) ||
        numericExperience < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Experience must be a valid positive number",
        });
      }

      doctor.experience =
        numericExperience;
    }

    if (consultationFee !== undefined) {
      const numericFee =
        Number(consultationFee);

      if (
        Number.isNaN(numericFee) ||
        numericFee < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Consultation fee must be a valid positive number",
        });
      }

      doctor.consultationFee =
        numericFee;
    }

    if (availableDays !== undefined) {
      doctor.availableDays =
        Array.isArray(availableDays)
          ? availableDays
          : [];
    }

    if (availability !== undefined) {
      doctor.availability =
        availability;
    }

    if (department !== undefined) {
      doctor.department =
        department.trim();
    }

    if (bio !== undefined) {
      doctor.bio = bio.trim();
    }

    await doctor.save();

    // Update User information
    const userUpdates = {};

    if (name !== undefined) {
      const trimmedName = name.trim();

      if (trimmedName.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Name must contain at least 2 characters",
        });
      }

      userUpdates.name = trimmedName;
    }

    if (email !== undefined) {
      const normalizedEmail =
        email.trim().toLowerCase();

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
          _id: {
            $ne: req.user._id,
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
      Object.keys(userUpdates).length > 0
    ) {
      await User.findByIdAndUpdate(
        req.user._id,
        userUpdates,
        {
          new: true,
          runValidators: true,
        }
      );
    }

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
        "Doctor profile updated successfully",
      data: {
        doctor: updatedDoctor,
      },
    });
  } catch (error) {
    console.error(
      "Update doctor profile error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A profile with this unique value already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating doctor profile",
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
};