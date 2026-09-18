import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Pill,
  Receipt,
  UserRound,
  RefreshCw,
} from "lucide-react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const sectionConfig = {
  appointments: {
    title: "My Appointments",
    subtitle: "View your upcoming and previous appointments.",
    endpoint: "/patient-portal/appointments",
    icon: CalendarDays,
  },

  "medical-records": {
    title: "Medical Records",
    subtitle: "View your medical history and clinical records.",
    endpoint: "/patient-portal/medical-records",
    icon: FileText,
  },

  prescriptions: {
    title: "Prescriptions",
    subtitle: "View medicines prescribed by your doctors.",
    endpoint: "/patient-portal/prescriptions",
    icon: Pill,
  },

  billing: {
    title: "Billing",
    subtitle: "View your bills and payment information.",
    endpoint: "/patient-portal/billing",
    icon: Receipt,
  },

  profile: {
    title: "My Profile",
    subtitle: "View your personal and patient information.",
    endpoint: "/patient-portal/me",
    icon: UserRound,
  },
};

const PatientPortalSection = ({ section }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const config = sectionConfig[section];

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("clinic_token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      if (!config) {
        setError("Invalid patient portal section.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          `${API_URL}${config.endpoint}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setData(response.data);
      } catch (err) {
        console.error(
          "Patient portal error:",
          err
        );

        if (
          err.response?.status === 401
        ) {
          localStorage.removeItem(
            "clinic_token"
          );

          localStorage.removeItem(
            "clinic_user"
          );

          navigate("/login", {
            replace: true,
          });

          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load this information."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    navigate,
    location.pathname,
    config,
  ]);

  const handleLogout = () => {
    localStorage.removeItem(
      "clinic_token"
    );

    localStorage.removeItem(
      "clinic_user"
    );

    sessionStorage.clear();

    navigate("/login", {
      replace: true,
    });
  };

  if (!config) {
    return (
      <div style={styles.center}>
        <h2>Page not found</h2>
        <button
          style={styles.primaryButton}
          onClick={() =>
            navigate("/patient-dashboard")
          }
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const Icon = config.icon;

  return (
    <div style={styles.page}>

      {/* ================= SIDEBAR ================= */}

      <aside style={styles.sidebar}>

        <div style={styles.brand}>
          <div style={styles.logo}>
            +
          </div>

          <div>
            <h2>CareSync</h2>
            <p>Patient Portal</p>
          </div>
        </div>

        <nav style={styles.nav}>

          <NavButton
            icon="▦"
            text="Dashboard"
            active={false}
            onClick={() =>
              navigate("/patient-dashboard")
            }
          />

          <NavButton
            icon="▣"
            text="My Appointments"
            active={
              section === "appointments"
            }
            onClick={() =>
              navigate(
                "/patient/appointments"
              )
            }
          />

          <NavButton
            icon="▤"
            text="Medical Records"
            active={
              section === "medical-records"
            }
            onClick={() =>
              navigate(
                "/patient/medical-records"
              )
            }
          />

          <NavButton
            icon="▥"
            text="Prescriptions"
            active={
              section === "prescriptions"
            }
            onClick={() =>
              navigate(
                "/patient/prescriptions"
              )
            }
          />

          <NavButton
            icon="₹"
            text="Billing"
            active={
              section === "billing"
            }
            onClick={() =>
              navigate(
                "/patient/billing"
              )
            }
          />

          <NavButton
            icon="◉"
            text="My Profile"
            active={
              section === "profile"
            }
            onClick={() =>
              navigate(
                "/patient/profile"
              )
            }
          />

        </nav>

        <button
          style={styles.logout}
          onClick={handleLogout}
        >
          ↪ &nbsp; Logout
        </button>

      </aside>

      {/* ================= MAIN ================= */}

      <main style={styles.main}>

        <header style={styles.header}>

          <div>

            <button
              style={styles.backButton}
              onClick={() =>
                navigate(
                  "/patient-dashboard"
                )
              }
            >
              <ArrowLeft size={17} />
              Dashboard
            </button>

            <div style={styles.headingRow}>

              <div style={styles.pageIcon}>
                <Icon size={25} />
              </div>

              <div>
                <h1 style={styles.heading}>
                  {config.title}
                </h1>

                <p style={styles.subtitle}>
                  {config.subtitle}
                </p>
              </div>

            </div>

          </div>

          <button
            style={styles.refreshButton}
            onClick={() =>
              window.location.reload()
            }
          >
            <RefreshCw size={16} />
            Refresh
          </button>

        </header>

        {/* ================= CONTENT ================= */}

        {loading && (
          <div style={styles.card}>
            <div style={styles.loading}>
              <div style={styles.spinner}></div>
              <p>
                Loading your information...
              </p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div style={styles.errorCard}>
            <h3>
              Something went wrong
            </h3>

            <p>{error}</p>

            <button
              style={styles.primaryButton}
              onClick={() =>
                window.location.reload()
              }
            >
              Try Again
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          data && (
            <ContentRenderer
              section={section}
              response={data}
            />
          )}

      </main>
    </div>
  );
};

/* ================= NAV BUTTON ================= */

const NavButton = ({
  icon,
  text,
  active,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.navButton,
        ...(active
          ? styles.activeNav
          : {}),
      }}
    >
      <span>{icon}</span>
      {text}
    </button>
  );
};

/* ================= CONTENT ================= */

const ContentRenderer = ({
  section,
  response,
}) => {
  const navigate = useNavigate();

  const rawData = response?.data;

  if (section === "profile") {
    const patient =
      rawData || {};

    return (
      <div style={styles.profileGrid}>

        <div style={styles.profileCard}>

          <div style={styles.profileAvatar}>
            {(patient.name || "P")
              .charAt(0)
              .toUpperCase()}
          </div>

          <h2>
            {patient.name ||
              "Patient"}
          </h2>

          <p style={styles.muted}>
            {patient.patientId ||
              "Patient ID unavailable"}
          </p>

        </div>

        <div style={styles.infoCard}>

          <h3>Personal Information</h3>

          <InfoRow
            label="Patient ID"
            value={
              patient.patientId
            }
          />

          <InfoRow
            label="Name"
            value={
              patient.name
            }
          />

          <InfoRow
            label="Email"
            value={
              patient.email
            }
          />

          <InfoRow
            label="Phone"
            value={
              patient.phone
            }
          />

          <InfoRow
            label="Gender"
            value={
              patient.gender
            }

          />

          <InfoRow
            label="Blood Group"
            value={
              patient.bloodGroup
            }
          />

          <InfoRow
            label="Address"
            value={
              patient.address
            }
          />

        </div>

        <div style={styles.infoCard}>

          <h3>
            Emergency Contact
          </h3>

          <InfoRow
            label="Name"
            value={
              patient
                .emergencyContact
                ?.name
            }
          />

          <InfoRow
            label="Phone"
            value={
              patient
                .emergencyContact
                ?.phone
            }
          />

          <InfoRow
            label="Relationship"
            value={
              patient
                .emergencyContact
                ?.relationship
            }
          />

        </div>

      </div>
    );
  }

  const items = Array.isArray(rawData)
    ? rawData
    : [];

  if (items.length === 0) {
    return (
      <div style={styles.emptyCard}>

        <div style={styles.emptyIcon}>
          ✓
        </div>

        <h2>
          No {section.replace("-", " ")} found
        </h2>

        <p>
          There is currently no information
          available in this section.
        </p>

        <button
          style={styles.primaryButton}
          onClick={() =>
            navigate(
              "/patient-dashboard"
            )
          }
        >
          Back to Dashboard
        </button>

      </div>
    );
  }

  return (
    <div>

      <div style={styles.countBar}>
        <strong>
          {items.length}{" "}
          {section === "appointments"
            ? "Appointments"
            : section ===
              "medical-records"
            ? "Medical Records"
            : section ===
              "prescriptions"
            ? "Prescriptions"
            : "Bills"}
        </strong>
      </div>

      <div style={styles.itemsGrid}>

        {items.map(
          (item, index) => (
            <DataCard
              key={
                item._id ||
                item.id ||
                index
              }
              section={section}
              item={item}
            />
          )
        )}

      </div>

    </div>
  );
};

/* ================= DATA CARD ================= */

const DataCard = ({
  section,
  item,
}) => {
  const doctor =
    item.doctor;

  return (
    <div style={styles.dataCard}>

      <div style={styles.dataCardHeader}>

        <div style={styles.smallIcon}>
          {section ===
          "appointments"
            ? "▣"
            : section ===
              "medical-records"
            ? "▤"
            : section ===
              "prescriptions"
            ? "▥"
            : "₹"}
        </div>

        <div>

          <h3 style={styles.dataTitle}>
            {section ===
            "appointments"
              ? "Appointment"
              : section ===
                "medical-records"
              ? "Medical Record"
              : section ===
                "prescriptions"
              ? "Prescription"
              : "Bill"}
          </h3>

          <span style={styles.dataDate}>
            {formatDate(
              item.createdAt ||
                item.appointmentDate
            )}
          </span>

        </div>

      </div>

      <div style={styles.dataBody}>

        {doctor && (
          <InfoRow
            label="Doctor"
            value={
              typeof doctor ===
              "object"
                ? doctor.name
                : doctor
            }
          />
        )}

        {section ===
          "appointments" && (
          <>
            <InfoRow
              label="Date"
              value={
                formatDate(
                  item.appointmentDate
                )
              }
            />

            <InfoRow
              label="Time"
              value={
                item.appointmentTime
              }
            />

            <InfoRow
              label="Status"
              value={
                item.status
              }
            />

            <InfoRow
              label="Reason"
              value={
                item.reason
              }
            />
          </>
        )}

        {section ===
          "medical-records" && (
          <>
            <InfoRow
              label="Diagnosis"
              value={
                item.diagnosis
              }
            />

            <InfoRow
              label="Symptoms"
              value={
                item.symptoms
              }
            />

            <InfoRow
              label="Notes"
              value={
                item.notes
              }
            />
          </>
        )}

        {section ===
          "prescriptions" && (
          <>
            <InfoRow
              label="Diagnosis"
              value={
                item.diagnosis
              }
            />

            <InfoRow
              label="Notes"
              value={
                item.notes
              }
            />

            <InfoRow
              label="Status"
              value={
                item.status
              }
            />

            {Array.isArray(
              item.medicines
            ) && (
              <div
                style={{
                  marginTop: "12px",
                }}
              >
                <strong
                  style={{
                    fontSize: "12px",
                  }}
                >
                  Medicines
                </strong>

                {item.medicines.map(
                  (medicine, i) => (
                    <div
                      key={i}
                      style={
                        styles.medicine
                      }
                    >
                      {medicine.name ||
                        medicine.medicineName ||
                        "Medicine"}

                      {medicine.dosage &&
                        ` — ${medicine.dosage}`}
                    </div>
                  )
                )}
              </div>
            )}
          </>
        )}

        {section ===
          "billing" && (
          <>
            <InfoRow
              label="Amount"
              value={
                formatCurrency(
                  item.totalAmount ??
                    item.amount ??
                    item.total
                )
              }
            />

            <InfoRow
              label="Status"
              value={
                item.paymentStatus ??
                  item.status
              }
            />

            <InfoRow
              label="Payment Method"
              value={
                item.paymentMethod
              }
            />
          </>
        )}

      </div>

    </div>
  );
};

/* ================= INFO ROW ================= */

const InfoRow = ({
  label,
  value,
}) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  return (
    <div style={styles.infoRow}>

      <span>
        {label}
      </span>

      <strong>
        {typeof value ===
        "object"
          ? JSON.stringify(value)
          : String(value)}
      </strong>

    </div>
  );
};

/* ================= HELPERS ================= */

const formatDate = (value) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(
    date.getTime()
  )) {
    return String(value);
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const formatCurrency = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "N/A";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return `₹${number.toLocaleString(
    "en-IN"
  )}`;
};

/* ================= STYLES ================= */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    color: "#172033",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  sidebar: {
    width: "250px",
    minHeight: "100vh",
    background: "#0f1f3d",
    color: "#fff",
    position: "fixed",
    left: 0,
    top: 0,
    display: "flex",
    flexDirection: "column",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "28px 22px",
    borderBottom:
      "1px solid rgba(255,255,255,.08)",
  },

  logo: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "#fff",
    color: "#0f1f3d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px",
    fontWeight: "800",
  },

  nav: {
    padding: "20px 14px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  navButton: {
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,.72)",
    padding: "13px 14px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    fontSize: "14px",
    textAlign: "left",
  },

  activeNav: {
    background:
      "rgba(255,255,255,.12)",
    color: "#fff",
  },

  logout: {
    marginTop: "auto",
    margin: "auto 14px 20px",
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,.75)",
    padding: "13px",
    cursor: "pointer",
    textAlign: "left",
    fontSize: "14px",
  },

  main: {
    marginLeft: "250px",
    padding: "35px 42px",
    minHeight: "100vh",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "30px",
  },

  backButton: {
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    color: "#64748b",
    cursor: "pointer",
    padding: 0,
    marginBottom: "18px",
    fontSize: "13px",
  },

  headingRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  pageIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    background: "#e9eef8",
    color: "#0f1f3d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  heading: {
    margin: 0,
    fontSize: "29px",
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#718096",
    fontSize: "14px",
  },

  refreshButton: {
    border: "1px solid #dce2eb",
    background: "#fff",
    padding: "10px 15px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    cursor: "pointer",
    fontWeight: "600",
  },

  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "35px",
    boxShadow:
      "0 5px 22px rgba(15,31,61,.05)",
  },

  loading: {
    minHeight: "250px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#718096",
  },

  spinner: {
    width: "32px",
    height: "32px",
    border: "4px solid #e3e8f0",
    borderTop:
      "4px solid #0f1f3d",
    borderRadius: "50%",
    marginBottom: "12px",
  },

  errorCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "40px",
    textAlign: "center",
    boxShadow:
      "0 5px 22px rgba(15,31,61,.05)",
  },

  primaryButton: {
    border: "none",
    background: "#0f1f3d",
    color: "#fff",
    padding: "11px 18px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "600",
  },

  countBar: {
    background: "#fff",
    borderRadius: "13px",
    padding: "15px 20px",
    marginBottom: "18px",
    boxShadow:
      "0 4px 15px rgba(15,31,61,.04)",
  },

  itemsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
  },

  dataCard: {
    background: "#fff",
    borderRadius: "17px",
    padding: "22px",
    boxShadow:
      "0 5px 20px rgba(15,31,61,.05)",
  },

  dataCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    paddingBottom: "15px",
    borderBottom:
      "1px solid #edf0f5",
    marginBottom: "14px",
  },

  smallIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "11px",
    background: "#eef2f8",
    color: "#0f1f3d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
  },

  dataTitle: {
    margin: 0,
    fontSize: "15px",
  },

  dataDate: {
    color: "#8a94a6",
    fontSize: "11px",
  },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    padding: "9px 0",
    borderBottom:
      "1px solid #f1f3f6",
    fontSize: "12px",
  },

  medicine: {
    background: "#f5f7fb",
    padding: "9px 11px",
    borderRadius: "8px",
    marginTop: "7px",
    fontSize: "12px",
  },

  emptyCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "65px 30px",
    textAlign: "center",
    boxShadow:
      "0 5px 22px rgba(15,31,61,.05)",
  },

  emptyIcon: {
    width: "55px",
    height: "55px",
    borderRadius: "50%",
    background: "#eef2f8",
    color: "#0f1f3d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 15px",
    fontSize: "22px",
  },

  profileGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(220px, .7fr) minmax(350px, 1.3fr)",
    gap: "18px",
  },

  profileCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "35px",
    textAlign: "center",
    boxShadow:
      "0 5px 20px rgba(15,31,61,.05)",
  },

  profileAvatar: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "#e9eef8",
    color: "#0f1f3d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    fontWeight: "700",
    margin: "0 auto 15px",
  },

  infoCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "25px",
    boxShadow:
      "0 5px 20px rgba(15,31,61,.05)",
  },

  muted: {
    color: "#718096",
    fontSize: "13px",
  },

  center: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
};

export default PatientPortalSection;