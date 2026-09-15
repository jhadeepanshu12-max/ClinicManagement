const express = require("express");

const {
  getDashboardStats,
  getRecentAppointments,
  getMonthlyFinance,
  getAppointmentAnalytics,
  getDoctorAnalytics,
  getPatientAnalytics,
} = require("../controllers/dashboardController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// All dashboard routes require authentication
router.use(protect);

// Dashboard statistics
router.get(
  "/stats",
  authorize("admin", "doctor", "receptionist"),
  getDashboardStats
);

// Recent appointments
router.get(
  "/recent-appointments",
  authorize("admin", "doctor", "receptionist"),
  getRecentAppointments
);

// Monthly financial analytics
router.get(
  "/monthly-finance",
  authorize("admin", "doctor", "receptionist"),
  getMonthlyFinance
);

// Appointment analytics
router.get(
  "/appointment-analytics",
  authorize("admin", "doctor", "receptionist"),
  getAppointmentAnalytics
);

// Doctor-wise analytics
router.get(
  "/doctor-analytics",
  authorize("admin", "doctor", "receptionist"),
  getDoctorAnalytics
);

// Patient-wise analytics
router.get(
  "/patient-analytics",
  authorize("admin", "doctor", "receptionist"),
  getPatientAnalytics
);

module.exports = router;