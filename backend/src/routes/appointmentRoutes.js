const express = require("express");

const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
} = require("../controllers/appointmentController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// Create appointment
// Admin and Receptionist can create appointments
router.post(
  "/",
  protect,
  authorize("admin", "receptionist"),
  createAppointment
);

// Get all appointments
// Admin, Doctor and Receptionist can view appointments
router.get(
  "/",
  protect,
  authorize("admin", "doctor", "receptionist"),
  getAppointments
);

// Get single appointment
// Admin, Doctor and Receptionist can view appointment details
router.get(
  "/:id",
  protect,
  authorize("admin", "doctor", "receptionist"),
  getAppointmentById
);

// Update appointment
// Admin and Receptionist can update appointments
router.put(
  "/:id",
  protect,
  authorize("admin", "receptionist"),
  updateAppointment
);

// Cancel appointment
// Admin and Receptionist can cancel appointments
router.delete(
  "/:id",
  protect,
  authorize("admin", "receptionist"),
  cancelAppointment
);

module.exports = router;