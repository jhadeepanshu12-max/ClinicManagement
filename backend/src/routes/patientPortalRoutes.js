const express = require("express");

const {
  getPatientProfile,
  getMyAppointments,
  getMyMedicalRecords,
  getMyPrescriptions,
  getMyBills,
  getPatientDashboard,
} = require("../controllers/patientPortalController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorize("patient"));

router.get("/dashboard", getPatientDashboard);
router.get("/me", getPatientProfile);
router.get("/appointments", getMyAppointments);
router.get("/medical-records", getMyMedicalRecords);
router.get("/prescriptions", getMyPrescriptions);
router.get("/billing", getMyBills);

module.exports = router;