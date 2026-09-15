import { useEffect, useState } from "react";
import axios from "axios";
import {
  Activity,
  Bell,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  Search,
  Settings,
  Stethoscope,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";

import "./App.css";

const navigation = [
  {
    section: "MAIN",
    items: [
      { label: "Dashboard", icon: LayoutDashboard },
      { label: "Patients", icon: Users },
      { label: "Doctors", icon: Stethoscope },
      { label: "Appointments", icon: CalendarDays },
    ],
  },
  {
    section: "CLINICAL",
    items: [
      { label: "Medical Records", icon: FileText },
      { label: "Prescriptions", icon: ClipboardList },
    ],
  },
  {
    section: "FINANCE & STOCK",
    items: [
      { label: "Billing", icon: CreditCard },
      { label: "Inventory", icon: Package },
      { label: "Expenses", icon: Wallet },
    ],
  },
];

const statConfig = [
  {
    title: "Total Patients",
    key: "patients",
    icon: Users,
    type: "blue",
  },
  {
    title: "Today's Appointments",
    key: "appointments",
    icon: CalendarDays,
    type: "green",
  },
  {
    title: "Total Doctors",
    key: "doctors",
    icon: Stethoscope,
    type: "purple",
  },
  {
    title: "Pending Payments",
    key: "finance",
    icon: Wallet,
    type: "orange",
  },
];

const formatCurrency = (value) => {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
};

const formatAppointmentTime = (time) => {
  if (!time) return "—";

  const [hourString, minuteString] = time.split(":");
  const hour = Number(hourString);
  const minute = Number(minuteString);

  if (Number.isNaN(hour)) return time;

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute || 0).padStart(2, "0")} ${suffix}`;
};

const formatStatus = (status) => {
  if (!status) return "Scheduled";

  return status
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getStatusClass = (status) => {
  switch (status) {
    case "confirmed":
      return "status-confirmed";
    case "scheduled":
      return "status-scheduled";
    case "completed":
      return "status-completed";
    case "cancelled":
      return "status-cancelled";
    case "no-show":
      return "status-no-show";
    default:
      return "status-scheduled";
  }
};

const getInitials = (name) => {
  if (!name) return "PT";

  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
};

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("Dashboard");

  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const storedUser = localStorage.getItem("clinic_user");

  const currentUser = storedUser
    ? JSON.parse(storedUser)
    : {
        name: "Admin",
        role: "Administrator",
      };

  const userName = currentUser.name || "Admin";
  const userRole = currentUser.role || "Administrator";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("clinic_token");

        if (!token) {
          setError("Authentication token not found.");
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [statsResponse, appointmentsResponse] = await Promise.all([
          axios.get(
            `${import.meta.env.VITE_API_URL}/dashboard/stats`,
            { headers }
          ),
          axios.get(
            `${import.meta.env.VITE_API_URL}/dashboard/recent-appointments?limit=5`,
            { headers }
          ),
        ]);

        setDashboardStats(statsResponse.data.data);
        setRecentAppointments(
          appointmentsResponse.data.data.appointments || []
        );
      } catch (requestError) {
        console.error("Dashboard data error:", requestError);

        if (requestError.response?.status === 401) {
          localStorage.removeItem("clinic_token");
          localStorage.removeItem("clinic_user");
          window.location.href = "/login";
          return;
        }

        setError(
          requestError.response?.data?.message ||
            "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatValue = (stat) => {
    if (!dashboardStats) return "—";

    if (stat.key === "patients") {
      return dashboardStats.patients?.total ?? 0;
    }

    if (stat.key === "appointments") {
      return dashboardStats.appointments?.today ?? 0;
    }

    if (stat.key === "doctors") {
      return dashboardStats.doctors?.total ?? 0;
    }

    if (stat.key === "finance") {
      return formatCurrency(
        dashboardStats.finance?.pendingAmount ?? 0
      );
    }

    return "0";
  };

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand-mark">
            <Activity size={23} strokeWidth={2.5} />
          </div>

          <div className="brand-text">
            <h1>CareSync</h1>
            <span>Clinic Management</span>
          </div>

          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="clinic-card">
          <div className="clinic-icon">
            <Stethoscope size={18} />
          </div>

          <div>
            <strong>CityCare Clinic</strong>
            <span>Admin Workspace</span>
          </div>

          <ChevronDown size={16} />
        </div>

        <nav className="navigation">
          {navigation.map((group) => (
            <div className="nav-group" key={group.section}>
              <p className="nav-section-title">{group.section}</p>

              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.label;

                return (
                  <button
                    key={item.label}
                    className={`nav-item ${active ? "active" : ""}`}
                    onClick={() => {
                      setActivePage(item.label);
                      setSidebarOpen(false);
                    }}
                  >
                    <Icon
                      size={19}
                      strokeWidth={active ? 2.4 : 2}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            className={`nav-item ${
              activePage === "Settings" ? "active" : ""
            }`}
            onClick={() => setActivePage("Settings")}
          >
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <div className="sidebar-profile">
            <div className="profile-avatar">
              {getInitials(userName)}
            </div>

            <div className="profile-info">
              <strong>{userName}</strong>
              <span>{userRole}</span>
            </div>

            <ChevronDown size={15} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>

            <div>
              <p className="breadcrumb">Clinic / Overview</p>
              <h2>{activePage}</h2>
            </div>
          </div>

          <div className="topbar-right">
            <div className="search-box">
              <Search size={18} />
              <input placeholder="Search patients, doctors..." />
              <span>⌘ K</span>
            </div>

            <button className="icon-button notification-button">
              <Bell size={20} />
              <span className="notification-dot" />
            </button>

            <div className="top-profile">
              <div className="profile-avatar">
                {getInitials(userName)}
              </div>

              <div>
                <strong>{userName}</strong>
                <span>{userRole}</span>
              </div>

              <ChevronDown size={16} />
            </div>
          </div>
        </header>

        <div className="dashboard-container">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>

              <h3>Good afternoon, {userName} 👋</h3>

              <p className="welcome-text">
                Here&apos;s what&apos;s happening at your clinic today.
              </p>
            </div>

            <button className="primary-button">
              <Plus size={18} />
              New Appointment
            </button>
          </section>

          {error && (
            <div className="dashboard-error">
              {error}
            </div>
          )}

          <section className="stats-grid">
            {statConfig.map((stat) => {
              const Icon = stat.icon;

              return (
                <article className="stat-card" key={stat.title}>
                  <div className="stat-card-top">
                    <div className={`stat-icon ${stat.type}`}>
                      <Icon size={21} />
                    </div>

                    <span className="stat-change neutral">
                      Live
                    </span>
                  </div>

                  <div className="stat-value">
                    {loading ? "..." : getStatValue(stat)}
                  </div>

                  <div className="stat-label">
                    <strong>{stat.title}</strong>
                    <span>from database</span>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="dashboard-grid">
            <article className="panel appointments-panel">
              <div className="panel-header">
                <div>
                  <h4>Recent Appointments</h4>
                  <p>
                    Latest appointments from your clinic
                  </p>
                </div>

                <button className="text-button">
                  View all
                </button>
              </div>

              <div className="appointments-list">
                {loading ? (
                  <div className="empty-state">
                    Loading appointments...
                  </div>
                ) : recentAppointments.length === 0 ? (
                  <div className="empty-state">
                    No appointments found.
                  </div>
                ) : (
                  recentAppointments.map((appointment) => {
                    const patient =
                      appointment.patient || {};

                    const doctor =
                      appointment.doctor || {};

                    return (
                      <div
                        className="appointment-row"
                        key={appointment._id}
                      >
                        <div className="patient-avatar">
                          {getInitials(patient.name)}
                        </div>

                        <div className="appointment-info">
                          <strong>
                            {patient.name || "Unknown Patient"}
                          </strong>

                          <span>
                            {doctor.name ||
                              "Doctor"}{" "}
                            ·{" "}
                            {doctor.specialization ||
                              "General"}
                          </span>
                        </div>

                        <div className="appointment-time">
                          <strong>
                            {formatAppointmentTime(
                              appointment.appointmentTime
                            )}
                          </strong>
                        </div>

                        <span
                          className={`status ${getStatusClass(
                            appointment.status
                          )}`}
                        >
                          {formatStatus(
                            appointment.status
                          )}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </article>

            <article className="panel quick-panel">
              <div className="panel-header">
                <div>
                  <h4>Quick Actions</h4>
                  <p>Frequently used clinic actions</p>
                </div>
              </div>

              <div className="quick-actions">
                <button>
                  <span className="quick-icon blue">
                    <UserRound size={20} />
                  </span>

                  <span>
                    <strong>Add Patient</strong>
                    <small>
                      Register a new patient
                    </small>
                  </span>

                  <Plus size={18} />
                </button>

                <button>
                  <span className="quick-icon green">
                    <CalendarDays size={20} />
                  </span>

                  <span>
                    <strong>Book Appointment</strong>
                    <small>
                      Schedule consultation
                    </small>
                  </span>

                  <Plus size={18} />
                </button>

                <button>
                  <span className="quick-icon purple">
                    <FileText size={20} />
                  </span>

                  <span>
                    <strong>
                      Create Medical Record
                    </strong>
                    <small>Add patient EMR</small>
                  </span>

                  <Plus size={18} />
                </button>

                <button>
                  <span className="quick-icon orange">
                    <CreditCard size={20} />
                  </span>

                  <span>
                    <strong>Create Invoice</strong>
                    <small>
                      Generate patient bill
                    </small>
                  </span>

                  <Plus size={18} />
                </button>
              </div>
            </article>
          </section>

          <section className="bottom-grid">
            <article className="panel overview-panel">
              <div className="panel-header">
                <div>
                  <h4>Clinic Overview</h4>
                  <p>Current operational snapshot</p>
                </div>

                <span className="live-badge">
                  <span />
                  Live
                </span>
              </div>

              <div className="overview-items">
                <div>
                  <span className="overview-label">
                    Completed Visits
                  </span>

                  <strong>
                    {loading
                      ? "..."
                      : dashboardStats?.appointments
                          ?.completed ?? 0}
                  </strong>

                  <small>All time</small>
                </div>

                <div>
                  <span className="overview-label">
                    Waiting / Scheduled
                  </span>

                  <strong>
                    {loading
                      ? "..."
                      : dashboardStats?.appointments
                          ?.scheduled ?? 0}
                  </strong>

                  <small>Current</small>
                </div>

                <div>
                  <span className="overview-label">
                    Low Stock Items
                  </span>

                  <strong>
                    {loading
                      ? "..."
                      : dashboardStats?.inventory
                          ?.lowStock ?? 0}
                  </strong>

                  <small>Needs attention</small>
                </div>

                <div>
                  <span className="overview-label">
                    Pending Bills
                  </span>

                  <strong>
                    {loading
                      ? "..."
                      : formatCurrency(
                          dashboardStats?.finance
                            ?.pendingAmount ?? 0
                        )}
                  </strong>

                  <small>Outstanding</small>
                </div>
              </div>
            </article>

            <article className="panel activity-panel">
              <div className="panel-header">
                <div>
                  <h4>System Status</h4>
                  <p>Application services</p>
                </div>
              </div>

              <div className="system-status">
                <div>
                  <span className="system-dot online" />
                  <span>Backend API</span>
                  <strong>Online</strong>
                </div>

                <div>
                  <span className="system-dot online" />
                  <span>Database</span>
                  <strong>Connected</strong>
                </div>

                <div>
                  <span className="system-dot online" />
                  <span>Authentication</span>
                  <strong>Active</strong>
                </div>
              </div>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;