const express = require("express");

const {
  createBilling,
  getBillings,
  getBillingById,
  getPatientBillingHistory,
  updateBilling,
  deactivateBilling,
} = require("../controllers/billingController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// All billing routes require authentication
router.use(protect);

// Create billing
router.post(
  "/",
  authorize("admin", "receptionist"),
  createBilling
);

// Get all billing records
router.get(
  "/",
  authorize("admin", "doctor", "receptionist"),
  getBillings
);

// Get patient billing history
router.get(
  "/patient/:patientId",
  authorize("admin", "doctor", "receptionist"),
  getPatientBillingHistory
);

// Get single billing record
router.get(
  "/:id",
  authorize("admin", "doctor", "receptionist"),
  getBillingById
);

// Update billing
router.put(
  "/:id",
  authorize("admin", "receptionist"),
  updateBilling
);

// Soft deactivate billing
router.delete(
  "/:id",
  authorize("admin"),
  deactivateBilling
);

module.exports = router;