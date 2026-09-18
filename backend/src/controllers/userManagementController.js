const bcrypt = require("bcryptjs");
const User = require("../models/user");

/*
  GET ALL STAFF USERS
  Admin only
*/
const getUsers = async (req, res) => {
  try {
    const users = await User.find({
      role: {
        $in: ["doctor", "receptionist"],
      },
    }).select("-password");

    return res.status(200).json({
      success: true,
      count: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching users.",
    });
  }
};

/*
  GET SINGLE USER
  Admin only
*/
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(
      req.params.id
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (
      !["doctor", "receptionist"].includes(
        user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This account cannot be managed from user management.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error(
      "Get user by ID error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error while fetching user.",
    });
  }
};

/*
  CREATE DOCTOR OR STAFF
  Admin only
*/
const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, password and role are required.",
      });
    }

    if (
      !["doctor", "receptionist"].includes(
        role
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only doctor or receptionist accounts can be created here.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters long.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || "",
      password,
      role,
      isActive: true,
    });

    const safeUser = await User.findById(
      user._id
    ).select("-password");

    return res.status(201).json({
      success: true,
      message:
        role === "doctor"
          ? "Doctor account created successfully."
          : "Staff account created successfully.",
      data: {
        user: safeUser,
      },
    });
  } catch (error) {
    console.error(
      "Create user error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating account.",
    });
  }
};

/*
  UPDATE DOCTOR OR STAFF
  Admin only
*/
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (
      !["doctor", "receptionist"].includes(
        user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This account cannot be managed here.",
      });
    }

    const {
      name,
      email,
      phone,
      role,
      isActive,
    } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty.",
        });
      }

      user.name = name.trim();
    }

    if (email !== undefined) {
      const normalizedEmail = email
        .trim()
        .toLowerCase();

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
          _id: {
            $ne: user._id,
          },
        });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message:
            "Another account already uses this email.",
        });
      }

      user.email = normalizedEmail;
    }

    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    if (role !== undefined) {
      if (
        !["doctor", "receptionist"].includes(
          role
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid staff role.",
        });
      }

      user.role = role;
    }

    if (isActive !== undefined) {
      user.isActive = Boolean(
        isActive
      );
    }

    await user.save();

    const safeUser = await User.findById(
      user._id
    ).select("-password");

    return res.status(200).json({
      success: true,
      message:
        "User account updated successfully.",
      data: {
        user: safeUser,
      },
    });
  } catch (error) {
    console.error(
      "Update user error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Another account already uses this email.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating account.",
    });
  }
};

/*
  RESET PASSWORD
  Admin only
*/
const resetPassword = async (
  req,
  res
) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message:
          "New password is required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters long.",
      });
    }

    const user = await User.findById(
      req.params.id
    ).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (
      !["doctor", "receptionist"].includes(
        user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Password reset is not available for this account.",
      });
    }

    user.password = password;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully.",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while resetting password.",
    });
  }
};

/*
  ACTIVATE / DEACTIVATE
  Admin only
*/
const toggleUserStatus = async (
  req,
  res
) => {
  try {
    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (
      !["doctor", "receptionist"].includes(
        user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This account cannot be managed here.",
      });
    }

    user.isActive = !user.isActive;

    await user.save();

    const safeUser = await User.findById(
      user._id
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: user.isActive
        ? "User account activated successfully."
        : "User account deactivated successfully.",
      data: {
        user: safeUser,
      },
    });
  } catch (error) {
    console.error(
      "Toggle user status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while changing account status.",
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  resetPassword,
  toggleUserStatus,
};