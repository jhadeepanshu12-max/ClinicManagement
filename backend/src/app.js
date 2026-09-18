const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Authentication
const authRoutes = require("./routes/authRoutes");
const patientAuthRoutes = require("./routes/patientAuthRoutes");

// Patient Portal
const patientPortalRoutes = require("./routes/patientPortalRoutes");

// Admin User Management
const userManagementRoutes = require("./routes/userManagementRoutes");

// Main Modules
const userRoutes = require("./routes/userRoutes");
const patientRoutes = require("./routes/patientRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const billingRoutes = require("./routes/billingRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

/*
|--------------------------------------------------------------------------
| Global Middleware
|--------------------------------------------------------------------------
*/

app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/

// Admin / Doctor / Staff login
app.use(
  "/api/auth",
  authRoutes
);

// Patient registration/login
app.use(
  "/api/patient-auth",
  patientAuthRoutes
);

/*
|--------------------------------------------------------------------------
| Patient Portal Routes
|--------------------------------------------------------------------------
*/

app.use(
  "/api/patient-portal",
  patientPortalRoutes
);

/*
|--------------------------------------------------------------------------
| Admin User Management
|--------------------------------------------------------------------------
|
| Admin can:
| - Create Doctor
| - Create Staff
| - View Doctor/Staff
| - Update Doctor/Staff
| - Activate/Deactivate
| - Reset Password
|
*/

app.use(
  "/api/user-management",
  userManagementRoutes
);

/*
|--------------------------------------------------------------------------
| Main Clinic Modules
|--------------------------------------------------------------------------
*/

// Users
app.use(
  "/api/users",
  userRoutes
);

// Patients
app.use(
  "/api/patients",
  patientRoutes
);

// Doctors
app.use(
  "/api/doctors",
  doctorRoutes
);

// Appointments
app.use(
  "/api/appointments",
  appointmentRoutes
);

// Medical Records
app.use(
  "/api/medical-records",
  medicalRecordRoutes
);

// Prescriptions
app.use(
  "/api/prescriptions",
  prescriptionRoutes
);

// Billing
app.use(
  "/api/billing",
  billingRoutes
);

// Inventory
app.use(
  "/api/inventory",
  inventoryRoutes
);

// Expenses
app.use(
  "/api/expenses",
  expenseRoutes
);

// Dashboard
app.use(
  "/api/dashboard",
  dashboardRoutes
);

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get(
  "/api/health",
  (req, res) => {
    return res.status(200).json({
      success: true,
      message:
        "Clinic Management API is running",
    });
  }
);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use(
  (req, res) => {
    return res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  }
);

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "Unhandled server error:",
      error
    );

    return res.status(
      error.status || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Internal server error.",
    });
  }
);

module.exports = app;