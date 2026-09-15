const express = require("express");

const {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
} = require("../controllers/patientController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// Create patient
// Admin and Receptionist can register patients
router.post(
  "/",
  protect,
  authorize("admin", "receptionist"),
  createPatient
);

// Get all patients
// Admin, Doctor and Receptionist can view patients
router.get(
  "/",
  protect,
  authorize("admin", "doctor", "receptionist"),
  getPatients
);

// Get single patient
// Admin, Doctor and Receptionist can view patient details
router.get(
  "/:id",
  protect,
  authorize("admin", "doctor", "receptionist"),
  getPatientById
);

// Update patient
// Admin, Doctor and Receptionist can update patient details
router.put(
  "/:id",
  protect,
  authorize("admin", "doctor", "receptionist"),
  updatePatient
);

// Deactivate patient
// Only Admin can deactivate a patient
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deletePatient
);

module.exports = router;