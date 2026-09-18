const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Patient = require("../models/patient");

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

const registerPatient = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      dateOfBirth,
      gender,
      address,
      bloodGroup,
      emergencyContact,
      medicalHistory,
      allergies,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !email ||
      !phone ||
      !password ||
      !dateOfBirth ||
      !gender
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, phone, password, date of birth and gender are required.",
      });
    }

    // Validate password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check whether account already exists
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Create patient user account
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password,
      role: "patient",
      isActive: true,
    });

    try {
      // Create patient profile
      const patient = await Patient.create({
        name: name.trim(),
        dateOfBirth,
        gender: gender.toLowerCase(),
        phone: phone.trim(),
        email: normalizedEmail,
        address: address?.trim(),
        bloodGroup: bloodGroup || "unknown",
        emergencyContact,
        medicalHistory: medicalHistory?.trim(),
        allergies: Array.isArray(allergies) ? allergies : [],
        createdBy: user._id,
        user: user._id,
        isActive: true,
      });

      // Generate login token
      const token = generateToken(user._id);

      return res.status(201).json({
        success: true,
        message: "Patient account created successfully.",
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
          },
          patient,
        },
      });
    } catch (patientError) {
      // Roll back user if patient profile creation fails
      await User.findByIdAndDelete(user._id);
      throw patientError;
    }
  } catch (error) {
    console.error("Patient registration error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An account or patient with these details already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while creating patient account.",
    });
  }
};

module.exports = {
  registerPatient,
};