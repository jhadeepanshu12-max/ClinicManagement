import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DoctorDashboard.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getStoredUser = () => {
  try {
    const user = localStorage.getItem("clinic_user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

const DoctorDashboard = () => {
  const navigate = useNavigate();

  const [user] = useState(getStoredUser);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("clinic_token");

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token]
  );

  useEffect(() => {
    const loadDashboard = async () => {
      if (!token || !user) {
        navigate("/role-selection", { replace: true });
        return;
      }

      if (user.role !== "doctor") {
        if (user.role === "admin") {
          navigate("/dashboard", { replace: true });
        } else if (user.role === "receptionist") {
          navigate("/staff-dashboard", { replace: true });
        } else {
          navigate("/patient-dashboard", { replace: true });
        }
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [appointmentResponse, patientResponse] = await Promise.all([
          fetch(`${API_URL}/appointments`, {
            headers: authHeaders,
          }),
          fetch(`${API_URL}/patients`, {
            headers: authHeaders,
          }),
        ]);

        const appointmentData = await appointmentResponse.json();
        const patientData = await patientResponse.json();

        if (appointmentResponse.ok) {
          setAppointments(
            appointmentData.data?.appointments ||
              appointmentData.data ||
              []
          );
        }

        if (patientResponse.ok) {
          setPatients(
            patientData.data?.patients ||
              patientData.data ||
              []
          );
        }

        if (!appointmentResponse.ok && !patientResponse.ok) {
          setError("Unable to load dashboard data.");
        }
      } catch (err) {
        console.error("Doctor dashboard error:", err);
        setError("Unable to connect to the clinic server.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [authHeaders, navigate, token, user]);

  const today = new Date();

  const isSameDay = (dateValue) => {
    if (!dateValue) return false;

    const date = new Date(dateValue);

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const todayAppointments = appointments.filter((appointment) =>
    isSameDay(
      appointment.date ||
        appointment.appointmentDate ||
        appointment.startTime
    )
  );

  const completedAppointments = appointments.filter(
    (appointment) =>
      String(appointment.status || "").toLowerCase() === "completed"
  );

  const pendingAppointments = appointments.filter((appointment) => {
    const status = String(appointment.status || "").toLowerCase();

    return (
      status === "pending" ||
      status === "scheduled" ||
      status === "confirmed"
    );
  });

  const upcomingAppointments = appointments
    .filter((appointment) => {
      const appointmentDate = new Date(
        appointment.date ||
          appointment.appointmentDate ||
          appointment.startTime
      );

      return !Number.isNaN(appointmentDate.getTime()) &&
        appointmentDate >= today;
    })
    .sort(
      (a, b) =>
        new Date(
          a.date || a.appointmentDate || a.startTime
        ) -
        new Date(
          b.date || b.appointmentDate || b.startTime
        )
    )
    .slice(0, 5);

  const getPatientName = (appointment) => {
    if (appointment.patient?.name) {
      return appointment.patient.name;
    }

    if (appointment.patientName) {
      return appointment.patientName;
    }

    if (typeof appointment.patient === "string") {
      return appointment.patient;
    }

    return "Patient";
  };

  const getAppointmentTime = (appointment) => {
    const value =
      appointment.time ||
      appointment.appointmentTime ||
      appointment.startTime;

    if (!value) return "Time not set";

    if (
      typeof value === "string" &&
      value.includes(":") &&
      value.length <= 8
    ) {
      return value;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAppointmentDate = (appointment) => {
    const value =
      appointment.date ||
      appointment.appointmentDate ||
      appointment.startTime;

    if (!value) return "Date not set";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("clinic_token");
    localStorage.removeItem("clinic_user");
    localStorage.removeItem("authenticated_role");
    localStorage.removeItem("selected_login_role");

    navigate("/role-selection", { replace: true });
  };

  const firstName = user?.name?.split(" ")[0] || "Doctor";

  return (
    <div className="doctor-dashboard">
      <aside className="doctor-sidebar">
        <div className="doctor-brand">
          <div className="doctor-brand-icon">+</div>

          <div>
            <h2>CareSync</h2>
            <span>Doctor Portal</span>
          </div>
        </div>

        <nav className="doctor-nav">
          <button className="doctor-nav-item active">
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className="doctor-nav-item"
            onClick={() => navigate("/appointments")}
          >
            <span>▣</span>
            My Appointments
          </button>

          <button
            className="doctor-nav-item"
            onClick={() => navigate("/patients")}
          >
            <span>♙</span>
            My Patients
          </button>

          <button
            className="doctor-nav-item"
            onClick={() => navigate("/medical-records")}
          >
            <span>▤</span>
            Medical Records
          </button>

          <button
            className="doctor-nav-item"
            onClick={() => navigate("/prescriptions")}
          >
            <span>Rx</span>
            Prescriptions
          </button>

          <button
            className="doctor-nav-item"
            onClick={() => navigate("/billing")}
          >
            <span>₹</span>
            Billing
          </button>
        </nav>

        <div className="doctor-sidebar-bottom">
          <button
            className="doctor-nav-item"
            onClick={() => window.alert("Profile settings coming soon.")}
          >
            <span>⚙</span>
            My Profile
          </button>

          <button
            className="doctor-logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="doctor-main">
        <header className="doctor-header">
          <div>
            <p className="doctor-header-label">DOCTOR PORTAL</p>
            <h1>Good morning, Dr. {firstName} 👋</h1>
            <p>
              Here's what's happening with your patients today.
            </p>
          </div>

          <div className="doctor-profile">
            <div className="doctor-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "D"}
            </div>

            <div>
              <strong>Dr. {user?.name || "Doctor"}</strong>
              <span>Doctor</span>
            </div>
          </div>
        </header>

        {error && (
          <div className="doctor-error">
            {error}
          </div>
        )}

        <section className="doctor-stats">
          <div className="doctor-stat-card">
            <div className="doctor-stat-icon">▣</div>
            <div>
              <span>Today's Appointments</span>
              <strong>
                {loading ? "—" : todayAppointments.length}
              </strong>
            </div>
          </div>

          <div className="doctor-stat-card">
            <div className="doctor-stat-icon">♙</div>
            <div>
              <span>Total Patients</span>
              <strong>
                {loading ? "—" : patients.length}
              </strong>
            </div>
          </div>

          <div className="doctor-stat-card">
            <div className="doctor-stat-icon">◷</div>
            <div>
              <span>Pending</span>
              <strong>
                {loading ? "—" : pendingAppointments.length}
              </strong>
            </div>
          </div>

          <div className="doctor-stat-card">
            <div className="doctor-stat-icon">✓</div>
            <div>
              <span>Completed</span>
              <strong>
                {loading ? "—" : completedAppointments.length}
              </strong>
            </div>
          </div>
        </section>

        <section className="doctor-content-grid">
          <div className="doctor-panel doctor-appointments-panel">
            <div className="doctor-panel-header">
              <div>
                <h2>Upcoming Appointments</h2>
                <p>Your next scheduled consultations</p>
              </div>

              <button
                className="doctor-view-all"
                onClick={() => navigate("/appointments")}
              >
                View all →
              </button>
            </div>

            {loading ? (
              <div className="doctor-empty">
                Loading appointments...
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="doctor-empty">
                <div className="doctor-empty-icon">▣</div>
                <h3>No upcoming appointments</h3>
                <p>
                  Your upcoming appointments will appear here.
                </p>
              </div>
            ) : (
              <div className="doctor-appointment-list">
                {upcomingAppointments.map((appointment, index) => (
                  <div
                    className="doctor-appointment"
                    key={appointment._id || appointment.id || index}
                  >
                    <div className="doctor-appointment-date">
                      <strong>
                        {getAppointmentTime(appointment)}
                      </strong>
                      <span>
                        {getAppointmentDate(appointment)}
                      </span>
                    </div>

                    <div className="doctor-appointment-patient">
                      <div className="doctor-patient-avatar">
                        {getPatientName(appointment)
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>
                          {getPatientName(appointment)}
                        </strong>

                        <span>
                          {appointment.type ||
                            appointment.reason ||
                            appointment.consultationType ||
                            "Consultation"}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`doctor-status ${String(
                        appointment.status || "scheduled"
                      )
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      {appointment.status || "Scheduled"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="doctor-panel doctor-quick-panel">
            <div className="doctor-panel-header">
              <div>
                <h2>Quick Actions</h2>
                <p>Common doctor activities</p>
              </div>
            </div>

            <div className="doctor-quick-actions">
              <button
                onClick={() => navigate("/patients")}
              >
                <span className="quick-action-icon">♙</span>
                <span>
                  <strong>View Patients</strong>
                  <small>Access patient profiles</small>
                </span>
              </button>

              <button
                onClick={() => navigate("/medical-records")}
              >
                <span className="quick-action-icon">▤</span>
                <span>
                  <strong>Medical Records</strong>
                  <small>Review patient history</small>
                </span>
              </button>

              <button
                onClick={() => navigate("/prescriptions")}
              >
                <span className="quick-action-icon">Rx</span>
                <span>
                  <strong>Prescriptions</strong>
                  <small>Manage prescriptions</small>
                </span>
              </button>

              <button
                onClick={() => navigate("/appointments")}
              >
                <span className="quick-action-icon">+</span>
                <span>
                  <strong>Appointments</strong>
                  <small>Manage your schedule</small>
                </span>
              </button>
            </div>
          </div>
        </section>

        <section className="doctor-panel doctor-patients-panel">
          <div className="doctor-panel-header">
            <div>
              <h2>Recent Patients</h2>
              <p>Patients available in the clinic system</p>
            </div>

            <button
              className="doctor-view-all"
              onClick={() => navigate("/patients")}
            >
              View all →
            </button>
          </div>

          {loading ? (
            <div className="doctor-empty">
              Loading patients...
            </div>
          ) : patients.length === 0 ? (
            <div className="doctor-empty">
              <div className="doctor-empty-icon">♙</div>
              <h3>No patients found</h3>
              <p>
                Patient information will appear here once available.
              </p>
            </div>
          ) : (
            <div className="doctor-patient-table">
              <div className="doctor-table-head">
                <span>Patient</span>
                <span>Patient ID</span>
                <span>Phone</span>
                <span>Status</span>
              </div>

              {patients.slice(0, 5).map((patient, index) => (
                <div
                  className="doctor-table-row"
                  key={patient._id || patient.id || index}
                >
                  <div className="doctor-table-patient">
                    <div className="doctor-patient-avatar">
                      {patient.name
                        ?.charAt(0)
                        ?.toUpperCase() || "P"}
                    </div>

                    <strong>
                      {patient.name || "Patient"}
                    </strong>
                  </div>

                  <span>
                    {patient.patientId || "—"}
                  </span>

                  <span>
                    {patient.phone || "—"}
                  </span>

                  <span
                    className={
                      patient.isActive === false
                        ? "doctor-inactive"
                        : "doctor-active"
                    }
                  >
                    {patient.isActive === false
                      ? "Inactive"
                      : "Active"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer className="doctor-footer">
          <span>CareSync Clinic Management</span>
          <span>Doctor Portal</span>
        </footer>
      </main>
    </div>
  );
};

export default DoctorDashboard;