const express = require("express");

const {
  getCurrentUser,
  updateProfile,
  changePassword,
  adminTest,
} = require("../controllers/usercontroller");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// Current authenticated user
router.get("/me", protect, getCurrentUser);

// Update current user's profile
router.put("/me", protect, updateProfile);

// Change current user's password
router.put("/change-password", protect, changePassword);

// Admin-only test endpoint
router.get(
  "/admin-test",
  protect,
  authorize("admin"),
  adminTest
);

module.exports = router;