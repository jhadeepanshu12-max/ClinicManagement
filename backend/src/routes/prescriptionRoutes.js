const express = require("express");

const {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  getPatientPrescriptionHistory,
  updatePrescription,
  deletePrescription,
} = require("../controllers/prescriptionController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// Create prescription
// Admin and Doctor can create prescriptions
router.post(
  "/",
  protect,
  authorize("admin", "doctor"),
  createPrescription
);

// Get all prescriptions
// Admin, Doctor and Receptionist can view prescriptions
router.get(
  "/",
  protect,
  authorize("admin", "doctor", "receptionist"),
  getPrescriptions
);

// Get patient prescription history
// Admin, Doctor and Receptionist can view history
router.get(
  "/patient/:patientId",
  protect,
  authorize("admin", "doctor", "receptionist"),
  getPatientPrescriptionHistory
);

// Get single prescription
// Admin, Doctor and Receptionist can view prescription
router.get(
  "/:id",
  protect,
  authorize("admin", "doctor", "receptionist"),
  getPrescriptionById
);

// Update prescription
// Admin and Doctor can update prescriptions
router.put(
  "/:id",
  protect,
  authorize("admin", "doctor"),
  updatePrescription
);

// Deactivate prescription
// Admin and Doctor can deactivate prescriptions
router.delete(
  "/:id",
  protect,
  authorize("admin", "doctor"),
  deletePrescription
);

module.exports = router;