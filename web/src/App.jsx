import React from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

/* =========================
   AUTH / ROLE PAGES
========================= */

import Login from "./pages/Login";
import RoleSelection from "./pages/RoleSelection";

/* =========================
   ADMIN / SHARED PAGES
========================= */

import Dashboard from "./Dashboard";
import Patients from "./pages/Patients";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import MedicalRecords from "./pages/MedicalRecords";
import Prescription from "./pages/Prescription";
import Billing from "./pages/Billing";
import Inventory from "./pages/Inventory";
import Expenses from "./pages/Expenses";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";

/* =========================
   ROLE-SPECIFIC DASHBOARDS
========================= */

import DoctorDashboard from "./pages/DoctorDashboard";
import StaffDashboard from "./pages/StaffDashboard";

/* =========================
   PATIENT PORTAL
========================= */

import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientPortalSection from "./pages/patient/PatientPortalSection";
import PatientRegister from "./pages/patient/PatientRegister";

/* =========================
   GET STORED USER
========================= */

const getUser = () => {
  try {
    const storedUser =
      localStorage.getItem("clinic_user");

    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser);
  } catch (error) {
    console.error(
      "Error reading clinic user:",
      error
    );

    return null;
  }
};

/* =========================
   ROLE → DEFAULT ROUTE
========================= */

const getDefaultRoute = (role) => {
  switch (role) {
    case "admin":
      return "/dashboard";

    case "doctor":
      return "/doctor-dashboard";

    case "receptionist":
      return "/staff-dashboard";

    case "patient":
      return "/patient-dashboard";

    default:
      return "/role-selection";
  }
};

/* =========================
   PROTECTED ROUTE
========================= */

const ProtectedRoute = ({
  children,
  allowedRoles,
}) => {
  const token =
    localStorage.getItem("clinic_token");

  const user = getUser();

  if (!token || !user) {
    return (
      <Navigate
        to="/role-selection"
        replace
      />
    );
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    return (
      <Navigate
        to={getDefaultRoute(user.role)}
        replace
      />
    );
  }

  return children;
};

/* =========================
   PUBLIC ROUTE
========================= */

const PublicRoute = ({ children }) => {
  const token =
    localStorage.getItem("clinic_token");

  const user = getUser();

  if (token && user) {
    return (
      <Navigate
        to={getDefaultRoute(user.role)}
        replace
      />
    );
  }

  return children;
};

/* =========================
   ROOT REDIRECT
========================= */

const RootRedirect = () => {
  const token =
    localStorage.getItem("clinic_token");

  const user = getUser();

  if (!token || !user) {
    return (
      <Navigate
        to="/role-selection"
        replace
      />
    );
  }

  return (
    <Navigate
      to={getDefaultRoute(user.role)}
      replace
    />
  );
};

/* =========================
   APP
========================= */

const App = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            PUBLIC ROUTES
        ========================= */}

        <Route
          path="/role-selection"
          element={
            <PublicRoute>
              <RoleSelection />
            </PublicRoute>
          }
        />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/patient-register"
          element={
            <PublicRoute>
              <PatientRegister />
            </PublicRoute>
          }
        />

        {/* =========================
            ADMIN DASHBOARD
        ========================= */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
            >
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* =========================
            ADMIN USER MANAGEMENT
        ========================= */}

        <Route
          path="/user-management"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
            >
              <UserManagement />
            </ProtectedRoute>
          }
        />

        {/* =========================
            DOCTOR DASHBOARD
        ========================= */}

        <Route
          path="/doctor-dashboard"
          element={
            <ProtectedRoute
              allowedRoles={["doctor"]}
            >
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />

        {/* =========================
            STAFF DASHBOARD
        ========================= */}

        <Route
          path="/staff-dashboard"
          element={
            <ProtectedRoute
              allowedRoles={["receptionist"]}
            >
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        {/* =========================
            PATIENT MANAGEMENT
        ========================= */}

        <Route
          path="/patients"
          element={
            <ProtectedRoute
              allowedRoles={[
                "admin",
                "doctor",
                "receptionist",
              ]}
            >
              <Patients />
            </ProtectedRoute>
          }
        />

        {/* =========================
            DOCTORS
        ========================= */}

        <Route
          path="/doctors"
          element={
            <ProtectedRoute
              allowedRoles={[
                "admin",
                "doctor",
                "receptionist",
              ]}
            >
              <Doctors />
            </ProtectedRoute>
          }
        />

        {/* =========================
            APPOINTMENTS
        ========================= */}

        <Route
          path="/appointments"
          element={
            <ProtectedRoute
              allowedRoles={[
                "admin",
                "doctor",
                "receptionist",
              ]}
            >
              <Appointments />
            </ProtectedRoute>
          }
        />

        {/* =========================
            MEDICAL RECORDS
        ========================= */}

        <Route
          path="/medical-records"
          element={
            <ProtectedRoute
              allowedRoles={[
                "admin",
                "doctor",
                "receptionist",
              ]}
            >
              <MedicalRecords />
            </ProtectedRoute>
          }
        />

        {/* =========================
            PRESCRIPTIONS
        ========================= */}

        <Route
          path="/prescription"
          element={
            <ProtectedRoute
              allowedRoles={[
                "admin",
                "doctor",
                "receptionist",
              ]}
            >
              <Prescription />
            </ProtectedRoute>
          }
        />

        <Route
          path="/prescriptions"
          element={
            <ProtectedRoute
              allowedRoles={[
                "admin",
                "doctor",
                "receptionist",
              ]}
            >
              <Prescription />
            </ProtectedRoute>
          }
        />

        {/* =========================
            BILLING
        ========================= */}

        <Route
          path="/billing"
          element={
            <ProtectedRoute
              allowedRoles={[
                "admin",
                "doctor",
                "receptionist",
              ]}
            >
              <Billing />
            </ProtectedRoute>
          }
        />

        {/* =========================
            INVENTORY
        ========================= */}

        <Route
          path="/inventory"
          element={
            <ProtectedRoute
              allowedRoles={[
                "admin",
                "receptionist",
              ]}
            >
              <Inventory />
            </ProtectedRoute>
          }
        />

        {/* =========================
            EXPENSES
        ========================= */}

        <Route
          path="/expenses"
          element={
            <ProtectedRoute
              allowedRoles={[
                "admin",
                "receptionist",
              ]}
            >
              <Expenses />
            </ProtectedRoute>
          }
        />

        {/* =========================
            SETTINGS
        ========================= */}

        <Route
          path="/settings"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
            >
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* =========================
            PATIENT DASHBOARD
        ========================= */}

        <Route
          path="/patient-dashboard"
          element={
            <ProtectedRoute
              allowedRoles={["patient"]}
            >
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        {/* =========================
            PATIENT APPOINTMENTS
        ========================= */}

        <Route
          path="/patient/appointments"
          element={
            <ProtectedRoute
              allowedRoles={["patient"]}
            >
              <PatientPortalSection
                section="appointments"
              />
            </ProtectedRoute>
          }
        />

        {/* =========================
            PATIENT MEDICAL RECORDS
        ========================= */}

        <Route
          path="/patient/medical-records"
          element={
            <ProtectedRoute
              allowedRoles={["patient"]}
            >
              <PatientPortalSection
                section="medical-records"
              />
            </ProtectedRoute>
          }
        />

        {/* =========================
            PATIENT PRESCRIPTIONS
        ========================= */}

        <Route
          path="/patient/prescriptions"
          element={
            <ProtectedRoute
              allowedRoles={["patient"]}
            >
              <PatientPortalSection
                section="prescriptions"
              />
            </ProtectedRoute>
          }
        />

        {/* =========================
            PATIENT BILLING
        ========================= */}

        <Route
          path="/patient/billing"
          element={
            <ProtectedRoute
              allowedRoles={["patient"]}
            >
              <PatientPortalSection
                section="billing"
              />
            </ProtectedRoute>
          }
        />

        {/* =========================
            PATIENT PROFILE
        ========================= */}

        <Route
          path="/patient/profile"
          element={
            <ProtectedRoute
              allowedRoles={["patient"]}
            >
              <PatientPortalSection
                section="profile"
              />
            </ProtectedRoute>
          }
        />

        {/* =========================
            ROOT
        ========================= */}

        <Route
          path="/"
          element={<RootRedirect />}
        />

        {/* =========================
            UNKNOWN ROUTES
        ========================= */}

        <Route
          path="*"
          element={<RootRedirect />}
        />

      </Routes>
    </BrowserRouter>
  );
};

export default App;