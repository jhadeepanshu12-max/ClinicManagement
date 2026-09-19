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
const doctorProfileRoutes = require("./routes/doctorProfileRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const billingRoutes = require("./routes/billingRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Body parsers
app.use(
  express.json({
    limit: "2mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

// Logging
app.use(morgan("dev"));

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/patient-auth",
  patientAuthRoutes
);

// ==========================================
// PATIENT PORTAL
// ==========================================

app.use(
  "/api/patient-portal",
  patientPortalRoutes
);

// ==========================================
// ADMIN USER MANAGEMENT
// ==========================================

app.use(
  "/api/user-management",
  userManagementRoutes
);

// ==========================================
// MAIN MODULES
// ==========================================

app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/patients",
  patientRoutes
);

app.use(
  "/api/doctors",
  doctorRoutes
);

// ==========================================
// DOCTOR SELF PROFILE
// ==========================================

app.use(
  "/api/doctor-profile",
  doctorProfileRoutes
);

app.use(
  "/api/appointments",
  appointmentRoutes
);

app.use(
  "/api/medical-records",
  medicalRecordRoutes
);

app.use(
  "/api/prescriptions",
  prescriptionRoutes
);

app.use(
  "/api/billing",
  billingRoutes
);

app.use(
  "/api/inventory",
  inventoryRoutes
);

app.use(
  "/api/expenses",
  expenseRoutes
);

app.use(
  "/api/dashboard",
  dashboardRoutes
);

// ==========================================
// HEALTH CHECK
// ==========================================

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

// ==========================================
// 404 HANDLER
// ==========================================

app.use(
  (req, res) => {
    return res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  }
);

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

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