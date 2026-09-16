import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Dashboard from "./Dashboard";

import Login from "./pages/Login";
import Patients from "./pages/Patients";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import MedicalRecords from "./pages/MedicalRecords";
import Prescription from "./pages/Prescription";
import Billing from "./pages/Billing";
import Inventory from "./pages/Inventory";
import Expenses from "./pages/Expenses";
import Settings from "./pages/Settings";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication */}
        <Route path="/login" element={<Login />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Patient Management */}
        <Route path="/patients" element={<Patients />} />

        {/* Doctor Management */}
        <Route path="/doctors" element={<Doctors />} />

        {/* Appointment Management */}
        <Route path="/appointments" element={<Appointments />} />

        {/* Medical Records / EMR */}
        <Route path="/medical-records" element={<MedicalRecords />} />

        {/* Prescriptions */}
        <Route path="/prescriptions" element={<Prescription />} />

        {/* Billing */}
        <Route path="/billing" element={<Billing />} />

        {/* Inventory & Pharmacy */}
        <Route path="/inventory" element={<Inventory />} />

        {/* Expenses */}
        <Route path="/expenses" element={<Expenses />} />

        {/* Settings */}
        <Route path="/settings" element={<Settings />} />

        {/* Default Route */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Unknown Routes */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;