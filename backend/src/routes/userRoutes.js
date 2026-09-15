const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// Any authenticated user
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authenticated user retrieved successfully",
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        isActive: req.user.isActive,
      },
    },
  });
});

// Admin-only test endpoint
router.get(
  "/admin-test",
  protect,
  authorize("admin"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Admin access granted",
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          role: req.user.role,
        },
      },
    });
  }
);

module.exports = router;