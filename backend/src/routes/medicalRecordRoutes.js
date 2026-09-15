const express = require("express");

const {
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecordById,
  getPatientMedicalHistory,
  updateMedicalRecord,
} = require("../controllers/medicalRecordController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// Create medical record
// Admin and Doctor can create medical records
router.post(
  "/",
  protect,
  authorize("admin", "doctor"),
  createMedicalRecord
);

// Get all medical records
// Admin, Doctor and Receptionist can view records
router.get(
  "/",
  protect,
  authorize("admin", "doctor", "receptionist"),
  getMedicalRecords
);

// Get patient medical history
// Admin, Doctor and Receptionist can view history
router.get(
  "/patient/:patientId",
  protect,
  authorize("admin", "doctor", "receptionist"),
  getPatientMedicalHistory
);

// Get single medical record
// Admin, Doctor and Receptionist can view record
router.get(
  "/:id",
  protect,
  authorize("admin", "doctor", "receptionist"),
  getMedicalRecordById
);

// Update medical record
// Admin and Doctor can update records
router.put(
  "/:id",
  protect,
  authorize("admin", "doctor"),
  updateMedicalRecord
);

module.exports = router;