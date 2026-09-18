import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StaffDashboard.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("clinic_user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Error reading clinic user:", error);
    return null;
  }
};

const StaffDashboard = () => {
  const navigate = useNavigate();

  const [user] = useState(getStoredUser);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("clinic_token");

  const headers = useMemo(
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

      if (user.role !== "receptionist") {
        if (user.role === "admin") {
          navigate("/dashboard", { replace: true });
        } else if (user.role === "doctor") {
          navigate("/doctor-dashboard", { replace: true });
        } else if (user.role === "patient") {
          navigate("/patient-dashboard", { replace: true });
        } else {
          navigate("/role-selection", { replace: true });
        }

        return;
      }

      try {
        setLoading(true);
        setError("");

        const [appointmentResponse, patientResponse] =
          await Promise.all([
            fetch(`${API_URL}/appointments`, {
              headers,
            }),
            fetch(`${API_URL}/patients`, {
              headers,
            }),
          ]);

        const appointmentData =
          await appointmentResponse.json();

        const patientData =
          await patientResponse.json();

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

        if (
          !appointmentResponse.ok &&
          !patientResponse.ok
        ) {
          setError("Unable to load dashboard data.");
        }
      } catch (err) {
        console.error("Staff dashboard error:", err);
        setError(
          "Unable to connect to the clinic server."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [headers, navigate, token, user]);

  const today = new Date();

  const isSameDay = (dateValue) => {
    if (!dateValue) {
      return false;
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const todayAppointments = appointments.filter(
    (appointment) =>
      isSameDay(
        appointment.date ||
          appointment.appointmentDate ||
          appointment.startTime
      )
  );

  const pendingAppointments = appointments.filter(
    (appointment) => {
      const status = String(
        appointment.status || ""
      ).toLowerCase();

      return (
        status === "pending" ||
        status === "scheduled" ||
        status === "confirmed"
      );
    }
  );

  const completedAppointments = appointments.filter(
    (appointment) =>
      String(appointment.status || "").toLowerCase() ===
      "completed"
  );

  const activePatients = patients.filter(
    (patient) => patient.isActive !== false
  );

  const upcomingAppointments = appointments
    .filter((appointment) => {
      const value =
        appointment.date ||
        appointment.appointmentDate ||
        appointment.startTime;

      if (!value) {
        return false;
      }

      const date = new Date(value);

      return (
        !Number.isNaN(date.getTime()) &&
        date >= today
      );
    })
    .sort((a, b) => {
      const first = new Date(
        a.date ||
          a.appointmentDate ||
          a.startTime
      );

      const second = new Date(
        b.date ||
          b.appointmentDate ||
          b.startTime
      );

      return first - second;
    })
    .slice(0, 6);

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

  const getDoctorName = (appointment) => {
    if (appointment.doctor?.name) {
      return appointment.doctor.name;
    }

    if (appointment.doctorName) {
      return appointment.doctorName;
    }

    if (typeof appointment.doctor === "string") {
      return appointment.doctor;
    }

    return "Doctor";
  };

  const getAppointmentDate = (appointment) => {
    const value =
      appointment.date ||
      appointment.appointmentDate ||
      appointment.startTime;

    if (!value) {
      return "Date not set";
    }

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

  const getAppointmentTime = (appointment) => {
    const value =
      appointment.time ||
      appointment.appointmentTime;

    if (value) {
      return String(value);
    }

    const dateValue =
      appointment.date ||
      appointment.appointmentDate ||
      appointment.startTime;

    if (!dateValue) {
      return "Time not set";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Time not set";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("clinic_token");
    localStorage.removeItem("clinic_user");
    localStorage.removeItem("authenticated_role");
    localStorage.removeItem("selected_login_role");

    navigate("/role-selection", {
      replace: true,
    });
  };

  const firstName =
    user?.name?.split(" ")[0] || "Staff";

  return (
    <div className="staff-dashboard">

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="staff-sidebar">

        <div className="staff-brand">
          <div className="staff-brand-icon">
            +
          </div>

          <div>
            <h2>CareSync</h2>
            <span>Staff Portal</span>
          </div>
        </div>

        <nav className="staff-nav">

          <button
            className="staff-nav-item active"
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className="staff-nav-item"
            onClick={() =>
              navigate("/patients")
            }
          >
            <span>♙</span>
            Patients
          </button>

          <button
            className="staff-nav-item"
            onClick={() =>
              navigate("/appointments")
            }
          >
            <span>▣</span>
            Appointments
          </button>

          <button
            className="staff-nav-item"
            onClick={() =>
              navigate("/billing")
            }
          >
            <span>₹</span>
            Billing
          </button>

          <button
            className="staff-nav-item"
            onClick={() =>
              navigate("/inventory")
            }
          >
            <span>▤</span>
            Inventory
          </button>

          <button
            className="staff-nav-item"
            onClick={() =>
              navigate("/expenses")
            }
          >
            <span>◈</span>
            Expenses
          </button>

          <button
            className="staff-nav-item"
            onClick={() =>
              navigate("/doctors")
            }
          >
            <span>⚕</span>
            Doctors
          </button>

        </nav>

        <div className="staff-sidebar-bottom">

          <button
            className="staff-nav-item"
            onClick={() =>
              window.alert(
                "Profile settings coming soon."
              )
            }
          >
            <span>⚙</span>
            My Profile
          </button>

          <button
            className="staff-logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>
      </aside>

      {/* =========================
          MAIN
      ========================= */}

      <main className="staff-main">

        <header className="staff-header">

          <div>
            <p className="staff-header-label">
              STAFF PORTAL
            </p>

            <h1>
              Good morning, {firstName} 👋
            </h1>

            <p>
              Manage patients, appointments and
              daily clinic operations.
            </p>
          </div>

          <div className="staff-profile">

            <div className="staff-avatar">
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() || "S"}
            </div>

            <div>
              <strong>
                {user?.name || "Staff Member"}
              </strong>

              <span>
                Receptionist / Staff
              </span>
            </div>

          </div>

        </header>

        {error && (
          <div className="staff-error">
            {error}
          </div>
        )}

        {/* =========================
            STATS
        ========================= */}

        <section className="staff-stats">

          <div className="staff-stat-card">

            <div className="staff-stat-icon">
              ▣
            </div>

            <div>
              <span>
                Today's Appointments
              </span>

              <strong>
                {loading
                  ? "—"
                  : todayAppointments.length}
              </strong>
            </div>

          </div>

          <div className="staff-stat-card">

            <div className="staff-stat-icon">
              ♙
            </div>

            <div>
              <span>
                Active Patients
              </span>

              <strong>
                {loading
                  ? "—"
                  : activePatients.length}
              </strong>
            </div>

          </div>

          <div className="staff-stat-card">

            <div className="staff-stat-icon">
              ◷
            </div>

            <div>
              <span>
                Pending Appointments
              </span>

              <strong>
                {loading
                  ? "—"
                  : pendingAppointments.length}
              </strong>
            </div>

          </div>

          <div className="staff-stat-card">

            <div className="staff-stat-icon">
              ✓
            </div>

            <div>
              <span>
                Completed
              </span>

              <strong>
                {loading
                  ? "—"
                  : completedAppointments.length}
              </strong>
            </div>

          </div>

        </section>

        {/* =========================
            MAIN CONTENT
        ========================= */}

        <section className="staff-content-grid">

          {/* APPOINTMENTS */}

          <div className="staff-panel">

            <div className="staff-panel-header">

              <div>
                <h2>
                  Today's Schedule
                </h2>

                <p>
                  Manage today's clinic
                  appointments
                </p>
              </div>

              <button
                className="staff-view-all"
                onClick={() =>
                  navigate("/appointments")
                }
              >
                View all →
              </button>

            </div>

            {loading ? (
              <div className="staff-empty">
                Loading appointments...
              </div>
            ) : todayAppointments.length === 0 ? (
              <div className="staff-empty">

                <div className="staff-empty-icon">
                  ▣
                </div>

                <h3>
                  No appointments today
                </h3>

                <p>
                  Today's appointments will
                  appear here.
                </p>

              </div>
            ) : (
              <div className="staff-appointment-list">

                {todayAppointments
                  .slice(0, 6)
                  .map(
                    (
                      appointment,
                      index
                    ) => (
                      <div
                        className="staff-appointment"
                        key={
                          appointment._id ||
                          appointment.id ||
                          index
                        }
                      >

                        <div className="staff-time">
                          <strong>
                            {getAppointmentTime(
                              appointment
                            )}
                          </strong>

                          <span>
                            {getAppointmentDate(
                              appointment
                            )}
                          </span>
                        </div>

                        <div className="staff-patient">

                          <div className="staff-patient-avatar">
                            {getPatientName(
                              appointment
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {getPatientName(
                                appointment
                              )}
                            </strong>

                            <span>
                              Dr.{" "}
                              {getDoctorName(
                                appointment
                              )}
                            </span>
                          </div>

                        </div>

                        <span
                          className={`staff-status ${String(
                            appointment.status ||
                              "scheduled"
                          )
                            .toLowerCase()
                            .replace(
                              /\s+/g,
                              "-"
                            )}`}
                        >
                          {appointment.status ||
                            "Scheduled"}
                        </span>

                      </div>
                    )
                  )}

              </div>
            )}

          </div>

          {/* QUICK ACTIONS */}

          <div className="staff-panel">

            <div className="staff-panel-header">

              <div>
                <h2>
                  Quick Actions
                </h2>

                <p>
                  Common reception tasks
                </p>
              </div>

            </div>

            <div className="staff-quick-actions">

              <button
                onClick={() =>
                  navigate("/patients")
                }
              >
                <span className="staff-action-icon">
                  ♙
                </span>

                <span>
                  <strong>
                    Register Patient
                  </strong>

                  <small>
                    Add a new patient
                  </small>
                </span>
              </button>

              <button
                onClick={() =>
                  navigate("/appointments")
                }
              >
                <span className="staff-action-icon">
                  +
                </span>

                <span>
                  <strong>
                    Book Appointment
                  </strong>

                  <small>
                    Schedule patient visit
                  </small>
                </span>
              </button>

              <button
                onClick={() =>
                  navigate("/billing")
                }
              >
                <span className="staff-action-icon">
                  ₹
                </span>

                <span>
                  <strong>
                    Create Bill
                  </strong>

                  <small>
                    Manage patient billing
                  </small>
                </span>
              </button>

              <button
                onClick={() =>
                  navigate("/inventory")
                }
              >
                <span className="staff-action-icon">
                  ▤
                </span>

                <span>
                  <strong>
                    Inventory
                  </strong>

                  <small>
                    Manage clinic stock
                  </small>
                </span>
              </button>

            </div>

          </div>

        </section>

        {/* =========================
            UPCOMING
        ========================= */}

        <section className="staff-panel staff-upcoming-panel">

          <div className="staff-panel-header">

            <div>
              <h2>
                Upcoming Appointments
              </h2>

              <p>
                Next scheduled patient visits
              </p>
            </div>

            <button
              className="staff-view-all"
              onClick={() =>
                navigate("/appointments")
              }
            >
              Manage →
            </button>

          </div>

          {loading ? (
            <div className="staff-empty">
              Loading...
            </div>
          ) : upcomingAppointments.length ===
            0 ? (
            <div className="staff-empty">
              <div className="staff-empty-icon">
                ▣
              </div>

              <h3>
                No upcoming appointments
              </h3>

              <p>
                New appointments will appear
                here.
              </p>
            </div>
          ) : (
            <div className="staff-table">

              <div className="staff-table-head">
                <span>Patient</span>
                <span>Doctor</span>
                <span>Date</span>
                <span>Time</span>
                <span>Status</span>
              </div>

              {upcomingAppointments.map(
                (
                  appointment,
                  index
                ) => (
                  <div
                    className="staff-table-row"
                    key={
                      appointment._id ||
                      appointment.id ||
                      index
                    }
                  >

                    <div className="staff-table-patient">

                      <div className="staff-patient-avatar">
                        {getPatientName(
                          appointment
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <strong>
                        {getPatientName(
                          appointment
                        )}
                      </strong>

                    </div>

                    <span>
                      Dr.{" "}
                      {getDoctorName(
                        appointment
                      )}
                    </span>

                    <span>
                      {getAppointmentDate(
                        appointment
                      )}
                    </span>

                    <span>
                      {getAppointmentTime(
                        appointment
                      )}
                    </span>

                    <span
                      className={`staff-status ${String(
                        appointment.status ||
                          "scheduled"
                      )
                        .toLowerCase()
                        .replace(
                          /\s+/g,
                          "-"
                        )}`}
                    >
                      {appointment.status ||
                        "Scheduled"}
                    </span>

                  </div>
                )
              )}

            </div>
          )}

        </section>

        {/* =========================
            FOOTER
        ========================= */}

        <footer className="staff-footer">

          <span>
            CareSync Clinic Management
          </span>

          <span>
            Staff Portal
          </span>

        </footer>

      </main>
    </div>
  );
};

export default StaffDashboard;