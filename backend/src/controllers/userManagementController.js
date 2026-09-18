const User = require("../models/user");
const Doctor = require("../models/doctor");

const getUsers = async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ["doctor", "receptionist"] },
    })
      .select("-password")
      .sort({ createdAt: -1 });

    // Create missing Doctor profiles for existing doctor accounts.
    const doctorUsers = users.filter(
      (user) => user.role === "doctor"
    );

    await Promise.all(
      doctorUsers.map(async (user) => {
        const existingDoctor = await Doctor.findOne({
          user: user._id,
        });

        if (existingDoctor) {
          return;
        }

        try {
          await Doctor.create({
            user: user._id,
            specialization: "General Medicine",
            qualification: "MBBS",
            licenseNumber: `USR-${user._id}`,
            experience: 0,
            consultationFee: 0,
            availableDays: [],
            availability: {
              startTime: "",
              endTime: "",
            },
            department: "General Medicine",
            bio: "",
            createdBy: req.user._id,
            isActive: user.isActive,
          });
        } catch (profileError) {
          console.error(
            `Doctor profile sync failed for ${user.email}:`,
            profileError.message
          );
        }
      })
    );

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully.",
      data: {
        users,
      },
    });
  } catch (error) {
    console.error("Get managed users error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while retrieving users.",
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      role: { $in: ["doctor", "receptionist"] },
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Doctor or staff user not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully.",
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Get managed user error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while retrieving user.",
    });
  }
};

const createUser = async (req, res) => {
  let createdUser = null;

  try {
    const {
      name,
      email,
      phone,
      password,
      role,
    } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters.",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    if (!["doctor", "receptionist"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be doctor or receptionist.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    createdUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || undefined,
      password,
      role,
      isActive: true,
    });

    // Create Doctor clinical profile automatically
    // when a Doctor login account is created.
    if (role === "doctor") {
      await Doctor.create({
        user: createdUser._id,
        specialization: "General Medicine",
        qualification: "MBBS",
        licenseNumber: `USR-${createdUser._id}`,
        experience: 0,
        consultationFee: 0,
        availableDays: [],
        availability: {
          startTime: "",
          endTime: "",
        },
        department: "General Medicine",
        bio: "",
        createdBy: req.user._id,
        isActive: true,
      });
    }

    const safeUser = await User.findById(
      createdUser._id
    ).select("-password");

    return res.status(201).json({
      success: true,
      message:
        role === "doctor"
          ? "Doctor account and profile created successfully."
          : "Staff account created successfully.",
      data: {
        user: safeUser,
      },
    });
  } catch (error) {
    console.error("Create managed user error:", error);

    // Rollback User if Doctor profile creation fails.
    if (createdUser?._id) {
      try {
        await User.findByIdAndDelete(
          createdUser._id
        );
      } catch (rollbackError) {
        console.error(
          "User rollback error:",
          rollbackError.message
        );
      }
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A user or doctor profile with the provided unique value already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while creating user.",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      role,
      isActive,
    } = req.body;

    const user = await User.findOne({
      _id: req.params.id,
      role: {
        $in: ["doctor", "receptionist"],
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Doctor or staff user not found.",
      });
    }

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty.",
        });
      }

      user.name = String(name).trim();
    }

    if (email !== undefined) {
      const normalizedEmail = String(
        email
      )
        .trim()
        .toLowerCase();

      if (!normalizedEmail) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty.",
        });
      }

      const emailOwner =
        await User.findOne({
          email: normalizedEmail,
          _id: { $ne: user._id },
        });

      if (emailOwner) {
        return res.status(409).json({
          success: false,
          message:
            "Another user already uses this email.",
        });
      }

      user.email = normalizedEmail;
    }

    if (phone !== undefined) {
      user.phone = String(phone).trim();
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
            "Role must be doctor or receptionist.",
        });
      }

      if (role !== user.role) {
        // Doctor -> Receptionist
        if (role === "receptionist") {
          await Doctor.findOneAndUpdate(
            { user: user._id },
            { isActive: false }
          );
        }

        // Receptionist -> Doctor
        if (role === "doctor") {
          const existingDoctor =
            await Doctor.findOne({
              user: user._id,
            });

          if (!existingDoctor) {
            await Doctor.create({
              user: user._id,
              specialization:
                "General Medicine",
              qualification: "MBBS",
              licenseNumber: `USR-${user._id}`,
              experience: 0,
              consultationFee: 0,
              availableDays: [],
              availability: {
                startTime: "",
                endTime: "",
              },
              department:
                "General Medicine",
              bio: "",
              createdBy: req.user._id,
              isActive: user.isActive,
            });
          } else {
            existingDoctor.isActive =
              user.isActive;

            await existingDoctor.save();
          }
        }

        user.role = role;
      }
    }

    if (isActive !== undefined) {
      user.isActive = Boolean(isActive);

      if (user.role === "doctor") {
        await Doctor.findOneAndUpdate(
          { user: user._id },
          {
            isActive: user.isActive,
          }
        );
      }
    }

    await user.save();

    const safeUser =
      await User.findById(
        user._id
      ).select("-password");

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      data: {
        user: safeUser,
      },
    });
  } catch (error) {
    console.error(
      "Update managed user error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A user with this email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating user.",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters.",
      });
    }

    const user =
      await User.findOne({
        _id: req.params.id,
        role: {
          $in: [
            "doctor",
            "receptionist",
          ],
        },
      }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Doctor or staff user not found.",
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
      "Reset managed user password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while resetting password.",
    });
  }
};

const toggleUserStatus = async (
  req,
  res
) => {
  try {
    const user =
      await User.findOne({
        _id: req.params.id,
        role: {
          $in: [
            "doctor",
            "receptionist",
          ],
        },
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Doctor or staff user not found.",
      });
    }

    user.isActive = !user.isActive;

    await user.save();

    if (user.role === "doctor") {
      await Doctor.findOneAndUpdate(
        { user: user._id },
        {
          isActive: user.isActive,
        }
      );
    }

    const safeUser =
      await User.findById(
        user._id
      ).select("-password");

    return res.status(200).json({
      success: true,
      message: user.isActive
        ? "User activated successfully."
        : "User deactivated successfully.",
      data: {
        user: safeUser,
      },
    });
  } catch (error) {
    console.error(
      "Toggle managed user status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while changing user status.",
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