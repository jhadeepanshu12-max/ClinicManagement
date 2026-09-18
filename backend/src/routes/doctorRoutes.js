const express = require("express");

const {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  restoreDoctor,
} = require("../controllers/doctorController");

const {
  protect,
} = require("../middleware/authMiddleware");

const authorize = require("../middleware/roleMiddleware");

const router = express.Router();


// ======================================================
// CREATE DOCTOR
// Admin only
// ======================================================

router.post(
  "/",
  protect,
  authorize("admin"),
  createDoctor
);


// ======================================================
// GET ALL DOCTORS
// Admin, Doctor and Receptionist
// ======================================================

router.get(
  "/",
  protect,
  authorize(
    "admin",
    "doctor",
    "receptionist"
  ),
  getDoctors
);


// ======================================================
// GET SINGLE DOCTOR
// Admin, Doctor and Receptionist
// ======================================================

router.get(
  "/:id",
  protect,
  authorize(
    "admin",
    "doctor",
    "receptionist"
  ),
  getDoctorById
);


// ======================================================
// UPDATE DOCTOR
// Admin only
// ======================================================

router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateDoctor
);


// ======================================================
// DEACTIVATE DOCTOR
// Admin only
// ======================================================

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteDoctor
);


// ======================================================
// REACTIVATE DOCTOR
// Admin only
// ======================================================

router.patch(
  "/:id/restore",
  protect,
  authorize("admin"),
  restoreDoctor
);


module.exports = router;