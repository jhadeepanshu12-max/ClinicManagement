const express = require("express");

const {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
} = require("../controllers/doctorController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// Create doctor - Admin only
router.post("/", protect, authorize("admin"), createDoctor);

// Get all doctors - Admin, Doctor and Receptionist
router.get(
  "/",
  protect,
  authorize("admin", "doctor", "receptionist"),
  getDoctors
);

// Get single doctor - Admin, Doctor and Receptionist
router.get(
  "/:id",
  protect,
  authorize("admin", "doctor", "receptionist"),
  getDoctorById
);

// Update doctor - Admin only
router.put("/:id", protect, authorize("admin"), updateDoctor);

// Deactivate doctor - Admin only
router.delete("/:id", protect, authorize("admin"), deleteDoctor);

module.exports = router;