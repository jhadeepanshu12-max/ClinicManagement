import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const PatientDashboard = () => {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = JSON.parse(
    localStorage.getItem("clinic_user") || "null"
  );

  const token = localStorage.getItem("clinic_token");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get(
          `${API_URL}/patient-portal/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setDashboard(response.data.data);
      } catch (err) {
        console.error("Patient dashboard error:", err);

        if (err.response?.status === 401) {
          localStorage.removeItem("clinic_token");
          localStorage.removeItem("clinic_user");
          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load patient dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate, token]);

  const logout = () => {
    localStorage.removeItem("clinic_token");
    localStorage.removeItem("clinic_user");
    navigate("/login");
  };

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loader}></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.errorBox}>
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button
            style={styles.primaryButton}
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const patient = dashboard?.patient;
  const stats = dashboard?.statistics || {};

  return (
    <div style={styles.page}>
      {/* ================= SIDEBAR ================= */}

      <aside style={styles.sidebar}>
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>+</div>
          <div>
            <h2 style={styles.logoText}>CareSync</h2>
            <p style={styles.logoSubtext}>Patient Portal</p>
          </div>
        </div>

        <nav style={styles.navigation}>
          <button
            style={{
              ...styles.navItem,
              ...styles.activeNavItem,
            }}
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            style={styles.navItem}
            onClick={() => navigate("/patient/appointments")}
          >
            <span>▣</span>
            My Appointments
          </button>

          <button
            style={styles.navItem}
            onClick={() =>
              navigate("/patient/medical-records")
            }
          >
            <span>▤</span>
            Medical Records
          </button>

          <button
            style={styles.navItem}
            onClick={() =>
              navigate("/patient/prescriptions")
            }
          >
            <span>▥</span>
            Prescriptions
          </button>

          <button
            style={styles.navItem}
            onClick={() => navigate("/patient/billing")}
          >
            <span>₹</span>
            Billing
          </button>

          <button
            style={styles.navItem}
            onClick={() => navigate("/patient/profile")}
          >
            <span>◉</span>
            My Profile
          </button>
        </nav>

        <div style={styles.sidebarBottom}>
          <button style={styles.logoutButton} onClick={logout}>
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}

      <main style={styles.main}>
        {/* HEADER */}

        <header style={styles.header}>
          <div>
            <p style={styles.welcomeSmall}>Patient Portal</p>

            <h1 style={styles.heading}>
              Welcome back, {patient?.name || user?.name || "Patient"} 👋
            </h1>

            <p style={styles.subHeading}>
              Manage your appointments, medical records and
              healthcare information.
            </p>
          </div>

          <div style={styles.profile}>
            <div style={styles.avatar}>
              {(patient?.name || user?.name || "P")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong style={styles.profileName}>
                {patient?.name || user?.name || "Patient"}
              </strong>

              <span style={styles.profileRole}>
                Patient
              </span>
            </div>
          </div>
        </header>

        {/* ================= PATIENT INFO ================= */}

        <section style={styles.patientCard}>
          <div>
            <p style={styles.cardLabel}>Patient ID</p>
            <h3 style={styles.patientId}>
              {patient?.patientId || "N/A"}
            </h3>
          </div>

          <div>
            <p style={styles.cardLabel}>Email</p>
            <h3 style={styles.patientInfo}>
              {patient?.email || "N/A"}
            </h3>
          </div>

          <div>
            <p style={styles.cardLabel}>Phone</p>
            <h3 style={styles.patientInfo}>
              {patient?.phone || "N/A"}
            </h3>
          </div>

          <button
            style={styles.outlineButton}
            onClick={() => navigate("/patient/profile")}
          >
            View Profile
          </button>
        </section>

        {/* ================= STATISTICS ================= */}

        <section style={styles.statsGrid}>
          <StatCard
            icon="▣"
            title="Total Appointments"
            value={stats.totalAppointments || 0}
            onClick={() => navigate("/patient/appointments")}
          />

          <StatCard
            icon="◷"
            title="Upcoming"
            value={stats.upcomingAppointments || 0}
            onClick={() => navigate("/patient/appointments")}
          />

          <StatCard
            icon="▤"
            title="Medical Records"
            value={stats.medicalRecords || 0}
            onClick={() =>
              navigate("/patient/medical-records")
            }
          />

          <StatCard
            icon="▥"
            title="Prescriptions"
            value={stats.prescriptions || 0}
            onClick={() =>
              navigate("/patient/prescriptions")
            }
          />

          <StatCard
            icon="₹"
            title="Bills"
            value={stats.bills || 0}
            onClick={() => navigate("/patient/billing")}
          />
        </section>

        {/* ================= QUICK ACTIONS ================= */}

        <section>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Quick Actions</h2>
              <p style={styles.sectionSubtitle}>
                Access your healthcare information quickly.
              </p>
            </div>
          </div>

          <div style={styles.actionsGrid}>
            <ActionCard
              icon="▣"
              title="My Appointments"
              description="View your upcoming and previous appointments."
              onClick={() =>
                navigate("/patient/appointments")
              }
            />

            <ActionCard
              icon="▤"
              title="Medical Records"
              description="View your diagnosis and medical history."
              onClick={() =>
                navigate("/patient/medical-records")
              }
            />

            <ActionCard
              icon="▥"
              title="Prescriptions"
              description="View medicines prescribed by your doctor."
              onClick={() =>
                navigate("/patient/prescriptions")
              }
            />

            <ActionCard
              icon="₹"
              title="Billing"
              description="Check your bills and payment information."
              onClick={() => navigate("/patient/billing")}
            />
          </div>
        </section>
      </main>
    </div>
  );
};

/* ================= STAT CARD ================= */

const StatCard = ({ icon, title, value, onClick }) => {
  return (
    <button style={styles.statCard} onClick={onClick}>
      <div style={styles.statIcon}>{icon}</div>

      <div style={styles.statContent}>
        <p style={styles.statTitle}>{title}</p>
        <h2 style={styles.statValue}>{value}</h2>
      </div>

      <span style={styles.arrow}>→</span>
    </button>
  );
};

/* ================= ACTION CARD ================= */

const ActionCard = ({
  icon,
  title,
  description,
  onClick,
}) => {
  return (
    <button style={styles.actionCard} onClick={onClick}>
      <div style={styles.actionIcon}>{icon}</div>

      <div style={styles.actionContent}>
        <h3 style={styles.actionTitle}>{title}</h3>

        <p style={styles.actionDescription}>
          {description}
        </p>

        <span style={styles.actionLink}>
          Open →
        </span>
      </div>
    </button>
  );
};

/* ================= STYLES ================= */

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    background: "#f5f7fb",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#172033",
  },

  sidebar: {
    width: "250px",
    minHeight: "100vh",
    background: "#0f1f3d",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
  },

  logoSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "28px 22px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  logoIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "#ffffff",
    color: "#0f1f3d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: "800",
  },

  logoText: {
    margin: 0,
    fontSize: "21px",
    fontWeight: "700",
  },

  logoSubtext: {
    margin: "3px 0 0",
    fontSize: "12px",
    opacity: 0.65,
  },

  navigation: {
    padding: "20px 14px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  navItem: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.72)",
    padding: "13px 14px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
    cursor: "pointer",
    textAlign: "left",
  },

  activeNavItem: {
    background: "rgba(255,255,255,0.12)",
    color: "#ffffff",
  },

  sidebarBottom: {
    marginTop: "auto",
    padding: "18px 14px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },

  logoutButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.7)",
    padding: "13px 14px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
    cursor: "pointer",
    textAlign: "left",
  },

  main: {
    marginLeft: "250px",
    width: "calc(100% - 250px)",
    padding: "34px 42px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "30px",
  },

  welcomeSmall: {
    margin: 0,
    color: "#718096",
    fontSize: "13px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.7px",
  },

  heading: {
    margin: "7px 0",
    fontSize: "30px",
    lineHeight: 1.2,
    fontWeight: "750",
  },

  subHeading: {
    margin: 0,
    color: "#718096",
    fontSize: "14px",
  },

  profile: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#ffffff",
    padding: "9px 14px",
    borderRadius: "14px",
    boxShadow: "0 4px 18px rgba(15,31,61,0.06)",
  },

  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#e9eef8",
    color: "#0f1f3d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
  },

  profileName: {
    display: "block",
    fontSize: "13px",
  },

  profileRole: {
    display: "block",
    color: "#718096",
    fontSize: "11px",
    marginTop: "2px",
  },

  patientCard: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "22px 26px",
    display: "grid",
    gridTemplateColumns: "1fr 1.5fr 1fr auto",
    gap: "24px",
    alignItems: "center",
    marginBottom: "24px",
    boxShadow: "0 5px 22px rgba(15,31,61,0.05)",
  },

  cardLabel: {
    margin: "0 0 5px",
    color: "#8a94a6",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontWeight: "600",
  },

  patientId: {
    margin: 0,
    fontSize: "17px",
    color: "#0f1f3d",
  },

  patientInfo: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "600",
  },

  outlineButton: {
    border: "1px solid #d9e0eb",
    background: "#ffffff",
    color: "#0f1f3d",
    padding: "10px 16px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "32px",
  },

  statCard: {
    border: "none",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 5px 20px rgba(15,31,61,0.05)",
    position: "relative",
  },

  statIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "#eef2f8",
    color: "#0f1f3d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    fontWeight: "700",
    flexShrink: 0,
  },

  statContent: {
    minWidth: 0,
  },

  statTitle: {
    margin: 0,
    color: "#7a8496",
    fontSize: "12px",
  },

  statValue: {
    margin: "5px 0 0",
    fontSize: "25px",
    lineHeight: 1,
  },

  arrow: {
    marginLeft: "auto",
    color: "#9aa4b4",
    fontSize: "18px",
  },

  sectionHeader: {
    marginBottom: "16px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "21px",
  },

  sectionSubtitle: {
    margin: "5px 0 0",
    color: "#7a8496",
    fontSize: "13px",
  },

  actionsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px",
  },

  actionCard: {
    border: "1px solid #e5e9f0",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    gap: "15px",
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(15,31,61,0.03)",
  },

  actionIcon: {
    width: "45px",
    height: "45px",
    borderRadius: "12px",
    background: "#eef2f8",
    color: "#0f1f3d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    fontWeight: "700",
    flexShrink: 0,
  },

  actionContent: {
    flex: 1,
  },

  actionTitle: {
    margin: "0 0 6px",
    fontSize: "15px",
  },

  actionDescription: {
    margin: 0,
    color: "#7a8496",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  actionLink: {
    display: "inline-block",
    marginTop: "11px",
    color: "#0f1f3d",
    fontSize: "12px",
    fontWeight: "700",
  },

  loadingScreen: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f7fb",
    color: "#0f1f3d",
  },

  loader: {
    width: "36px",
    height: "36px",
    border: "4px solid #dfe5ef",
    borderTop: "4px solid #0f1f3d",
    borderRadius: "50%",
    marginBottom: "12px",
  },

  errorBox: {
    background: "#ffffff",
    padding: "35px",
    borderRadius: "18px",
    textAlign: "center",
    boxShadow: "0 8px 30px rgba(15,31,61,0.08)",
  },

  primaryButton: {
    border: "none",
    background: "#0f1f3d",
    color: "#ffffff",
    padding: "11px 20px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "600",
  },
};

export default PatientDashboard;