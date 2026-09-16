import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Activity,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
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
import { useLocation, useNavigate } from "react-router-dom";

import "./Dashboard.css";

const navigation = [
  {
    section: "MAIN",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { label: "Patients", icon: Users, path: "/patients" },
      { label: "Doctors", icon: Stethoscope, path: "/doctors" },
      { label: "Appointments", icon: CalendarDays, path: "/appointments" },
    ],
  },
  {
    section: "CLINICAL",
    items: [
      {
        label: "Medical Records",
        icon: FileText,
        path: "/medical-records",
      },
      {
        label: "Prescriptions",
        icon: ClipboardList,
        path: "/prescriptions",
      },
    ],
  },
  {
    section: "FINANCE & STOCK",
    items: [
      { label: "Billing", icon: CreditCard, path: "/billing" },
      { label: "Inventory", icon: Package, path: "/inventory" },
      { label: "Expenses", icon: Wallet, path: "/expenses" },
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

const quickActions = [
  {
    title: "Add Patient",
    description: "Register a new patient",
    icon: UserRound,
    color: "blue",
    path: "/patients",
  },
  {
    title: "Book Appointment",
    description: "Schedule consultation",
    icon: CalendarDays,
    color: "green",
    path: "/appointments",
  },
  {
    title: "Create Medical Record",
    description: "Add patient EMR",
    icon: FileText,
    color: "purple",
    path: "/medical-records",
  },
  {
    title: "Create Invoice",
    description: "Generate patient bill",
    icon: CreditCard,
    color: "orange",
    path: "/billing",
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
    .map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1)
    )
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

const getCurrentPage = (pathname) => {
  const allItems = navigation.flatMap((group) => group.items);

  const currentItem = allItems.find(
    (item) => item.path === pathname
  );

  return currentItem?.label || "Dashboard";
};

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Separate states for the two profile menus.
  const [topProfileOpen, setTopProfileOpen] = useState(false);
  const [sidebarProfileOpen, setSidebarProfileOpen] = useState(false);

  const storedUser = localStorage.getItem("clinic_user");

  const currentUser = storedUser
    ? JSON.parse(storedUser)
    : {
        name: "Admin",
        role: "Administrator",
      };

  const userName = currentUser.name || "Admin";
  const userRole = currentUser.role || "Administrator";

  const activePage = getCurrentPage(location.pathname);

  const token = localStorage.getItem("clinic_token");

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const handleLogout = () => {
    localStorage.removeItem("clinic_token");
    localStorage.removeItem("clinic_user");

    navigate("/login", { replace: true });
  };

  const goTo = (path) => {
    setSidebarOpen(false);
    setSearchOpen(false);
    setNotificationsOpen(false);
    setTopProfileOpen(false);
    setSidebarProfileOpen(false);

    navigate(path);
  };

  /* =========================
     DASHBOARD DATA
  ========================= */

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [statsResponse, appointmentsResponse] =
          await Promise.all([
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
          handleLogout();
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
  }, [headers, navigate, token]);

  /* =========================
     SEARCH
  ========================= */

  useEffect(() => {
    const performSearch = async () => {
      const query = searchTerm.trim().toLowerCase();

      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const [patientsResponse, doctorsResponse] =
          await Promise.all([
            axios.get(
              `${import.meta.env.VITE_API_URL}/patients`,
              { headers }
            ),
            axios.get(
              `${import.meta.env.VITE_API_URL}/doctors`,
              { headers }
            ),
          ]);

        const patients =
          patientsResponse.data.data?.patients || [];

        const doctors =
          doctorsResponse.data.data?.doctors || [];

        const patientResults = patients
          .filter((patient) => {
            const searchableText = [
              patient.name,
              patient.email,
              patient.phone,
              patient.patientId,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return searchableText.includes(query);
          })
          .slice(0, 5)
          .map((patient) => ({
            id: patient._id,
            type: "patient",
            title: patient.name,
            subtitle: patient.patientId || "Patient",
            icon: Users,
            path: "/patients",
          }));

        const doctorResults = doctors
          .filter((doctor) => {
            const user = doctor.user || {};

            const searchableText = [
              user.name,
              user.email,
              user.phone,
              doctor.specialization,
              doctor.licenseNumber,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return searchableText.includes(query);
          })
          .slice(0, 5)
          .map((doctor) => ({
            id: doctor._id,
            type: "doctor",
            title: doctor.user?.name || "Doctor",
            subtitle:
              doctor.specialization || "Medical Specialist",
            icon: Stethoscope,
            path: "/doctors",
          }));

        setSearchResults([
          ...patientResults,
          ...doctorResults,
        ]);
      } catch (searchError) {
        console.error("Search error:", searchError);
        setSearchResults([]);
      }
    };

    const timer = setTimeout(performSearch, 250);

    return () => clearTimeout(timer);
  }, [searchTerm, headers]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const handleSearchSelect = (result) => {
    setSearchTerm("");
    setSearchOpen(false);
    navigate(result.path);
  };

  /* =========================
     STATS
  ========================= */

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
    <div className="dashboard-shell">
      {sidebarOpen && (
        <button
          className="dashboard-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside
        className={`dashboard-sidebar ${
          sidebarOpen ? "dashboard-sidebar-open" : ""
        }`}
      >
        <div className="dashboard-brand">
          <div className="dashboard-brand-mark">
            <Activity size={23} strokeWidth={2.6} />
          </div>

          <div>
            <h1>CareSync</h1>
            <span>Clinic Management</span>
          </div>

          <button
            className="dashboard-mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="dashboard-clinic-card">
          <div className="dashboard-clinic-icon">
            <Stethoscope size={19} />
          </div>

          <div className="dashboard-clinic-info">
            <strong>CityCare Clinic</strong>
            <span>Admin Workspace</span>
          </div>

          <ChevronDown size={16} />
        </div>

        <nav className="dashboard-navigation">
          {navigation.map((group) => (
            <div
              className="dashboard-nav-group"
              key={group.section}
            >
              <p>{group.section}</p>

              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.label;

                return (
                  <button
                    key={item.label}
                    className={`dashboard-nav-item ${
                      active ? "active" : ""
                    }`}
                    onClick={() => goTo(item.path)}
                  >
                    <Icon
                      size={18}
                      strokeWidth={active ? 2.4 : 2}
                    />

                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="dashboard-sidebar-bottom">
          {/* SIDEBAR SETTINGS */}
          <button
            className={`dashboard-nav-item ${
              location.pathname === "/settings" ? "active" : ""
            }`}
            onClick={() => goTo("/settings")}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>

          {/* SIDEBAR PROFILE */}
          <button
            className="dashboard-sidebar-profile"
            onClick={() => {
              setTopProfileOpen(false);
              setNotificationsOpen(false);
              setSidebarProfileOpen(
                (previous) => !previous
              );
            }}
          >
            <div className="dashboard-profile-avatar">
              {getInitials(userName)}
            </div>

            <div className="dashboard-profile-info">
              <strong>{userName}</strong>
              <span>{userRole}</span>
            </div>

            <ChevronDown size={15} />
          </button>

          {sidebarProfileOpen && (
            <div className="dashboard-profile-menu sidebar-profile-menu">
              <div className="profile-menu-user">
                <div className="dashboard-profile-avatar">
                  {getInitials(userName)}
                </div>

                <div>
                  <strong>{userName}</strong>
                  <span>{userRole}</span>
                </div>
              </div>

              <div className="profile-menu-divider" />

              <button onClick={() => goTo("/settings")}>
                <UserRound size={16} />
                Profile
              </button>

              <button onClick={() => goTo("/settings")}>
                <Settings size={16} />
                Settings
              </button>

              <button
                className="logout-button"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* =========================
          MAIN
      ========================= */}

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-left">
            <button
              className="dashboard-mobile-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={21} />
            </button>

            <div>
              <p>Clinic / {activePage}</p>
              <h2>{activePage}</h2>
            </div>
          </div>

          <div className="dashboard-topbar-right">
            {/* SEARCH */}

            <div
              className="dashboard-search-wrapper"
              ref={searchRef}
            >
              <div
                className={`dashboard-search ${
                  searchOpen ? "focused" : ""
                }`}
              >
                <Search size={18} />

                <input
                  value={searchTerm}
                  placeholder="Search patients, doctors..."
                  onFocus={() => setSearchOpen(true)}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setSearchOpen(true);
                  }}
                />

                <kbd>⌘ K</kbd>
              </div>

              {searchOpen &&
                searchTerm.trim().length >= 2 && (
                  <div className="dashboard-search-results">
                    {searchResults.length === 0 ? (
                      <div className="search-empty">
                        <Search size={18} />
                        <span>
                          No patients or doctors found
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="search-results-heading">
                          Search Results
                        </div>

                        {searchResults.map((result) => {
                          const Icon = result.icon;

                          return (
                            <button
                              key={`${result.type}-${result.id}`}
                              className="search-result-item"
                              onClick={() =>
                                handleSearchSelect(result)
                              }
                            >
                              <span
                                className={`search-result-icon ${result.type}`}
                              >
                                <Icon size={17} />
                              </span>

                              <span className="search-result-text">
                                <strong>
                                  {result.title}
                                </strong>

                                <small>
                                  {result.subtitle}
                                </small>
                              </span>

                              <span className="search-result-type">
                                {result.type}
                              </span>
                            </button>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
            </div>

            {/* NOTIFICATIONS */}

            <div className="dashboard-notification-wrapper">
              <button
                className={`dashboard-icon-button ${
                  notificationsOpen ? "active" : ""
                }`}
                onClick={() => {
                  setTopProfileOpen(false);
                  setSidebarProfileOpen(false);
                  setNotificationsOpen(
                    (previous) => !previous
                  );
                }}
                aria-label="Notifications"
              >
                <Bell size={19} />
                <span className="dashboard-notification-dot" />
              </button>

              {notificationsOpen && (
                <div className="dashboard-notification-menu">
                  <div className="notification-menu-header">
                    <div>
                      <strong>Notifications</strong>
                      <span>Clinic updates</span>
                    </div>

                    <span className="notification-count">
                      3
                    </span>
                  </div>

                  <div className="notification-item">
                    <span className="notification-icon blue">
                      <CalendarDays size={16} />
                    </span>

                    <div>
                      <strong>Appointments</strong>
                      <p>
                        Check today&apos;s appointment
                        schedule.
                      </p>
                    </div>
                  </div>

                  <div className="notification-item">
                    <span className="notification-icon orange">
                      <Package size={16} />
                    </span>

                    <div>
                      <strong>Inventory</strong>
                      <p>
                        Keep an eye on low stock items.
                      </p>
                    </div>
                  </div>

                  <div className="notification-item">
                    <span className="notification-icon green">
                      <CheckCircle2 size={16} />
                    </span>

                    <div>
                      <strong>System Online</strong>
                      <p>
                        Backend and database are connected.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* TOP PROFILE */}

            <div className="dashboard-top-profile-wrapper">
              <button
                className="dashboard-top-profile"
                onClick={() => {
                  setSidebarProfileOpen(false);
                  setNotificationsOpen(false);
                  setTopProfileOpen(
                    (previous) => !previous
                  );
                }}
              >
                <div className="dashboard-profile-avatar">
                  {getInitials(userName)}
                </div>

                <div className="dashboard-top-profile-info">
                  <strong>{userName}</strong>
                  <span>{userRole}</span>
                </div>

                <ChevronDown size={15} />
              </button>

              {topProfileOpen && (
                <div className="dashboard-profile-menu">
                  <div className="profile-menu-user">
                    <div className="dashboard-profile-avatar">
                      {getInitials(userName)}
                    </div>

                    <div>
                      <strong>{userName}</strong>
                      <span>{userRole}</span>
                    </div>
                  </div>

                  <div className="profile-menu-divider" />

                  <button
                    onClick={() => goTo("/settings")}
                  >
                    <UserRound size={16} />
                    Profile
                  </button>

                  <button
                    onClick={() => goTo("/settings")}
                  >
                    <Settings size={16} />
                    Settings
                  </button>

                  <button
                    className="logout-button"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {/* WELCOME */}

          <section className="dashboard-welcome">
            <div>
              <span className="dashboard-date">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>

              <h3>
                Good afternoon, {userName}{" "}
                <span>👋</span>
              </h3>

              <p>
                Here&apos;s what&apos;s happening at your
                clinic today.
              </p>
            </div>

            <button
              className="dashboard-primary-button"
              onClick={() => navigate("/appointments")}
            >
              <Plus size={18} />
              New Appointment
            </button>
          </section>

          {error && (
            <div className="dashboard-error">
              {error}
            </div>
          )}

          {/* STATS */}

          <section className="dashboard-stats-grid">
            {statConfig.map((stat) => {
              const Icon = stat.icon;

              return (
                <article
                  className={`dashboard-stat-card ${stat.type}`}
                  key={stat.title}
                >
                  <div className="dashboard-stat-top">
                    <div className="dashboard-stat-icon">
                      <Icon size={21} />
                    </div>

                    <span className="dashboard-live-pill">
                      <span />
                      Live
                    </span>
                  </div>

                  <div className="dashboard-stat-number">
                    {loading ? "..." : getStatValue(stat)}
                  </div>

                  <div className="dashboard-stat-title">
                    <strong>{stat.title}</strong>
                    <span>From database</span>
                  </div>
                </article>
              );
            })}
          </section>

          {/* APPOINTMENTS + QUICK ACTIONS */}

          <section className="dashboard-main-grid">
            <article className="dashboard-panel appointments-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h4>Recent Appointments</h4>
                  <p>
                    Latest appointments from your clinic
                  </p>
                </div>

                <button
                  onClick={() => navigate("/appointments")}
                >
                  View all
                </button>
              </div>

              <div className="dashboard-appointments-list">
                {loading ? (
                  <div className="dashboard-empty">
                    Loading appointments...
                  </div>
                ) : recentAppointments.length === 0 ? (
                  <div className="dashboard-empty">
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
                        className="dashboard-appointment-row"
                        key={appointment._id}
                      >
                        <div className="dashboard-patient-avatar">
                          {getInitials(patient.name)}
                        </div>

                        <div className="dashboard-appointment-info">
                          <strong>
                            {patient.name ||
                              "Unknown Patient"}
                          </strong>

                          <span>
                            {doctor.name || "Doctor"} ·{" "}
                            {doctor.specialization ||
                              "General"}
                          </span>
                        </div>

                        <div className="dashboard-appointment-time">
                          {formatAppointmentTime(
                            appointment.appointmentTime
                          )}
                        </div>

                        <span
                          className={`dashboard-status ${getStatusClass(
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

            <article className="dashboard-panel quick-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h4>Quick Actions</h4>
                  <p>
                    Frequently used clinic actions
                  </p>
                </div>
              </div>

              <div className="dashboard-quick-actions">
                {quickActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.title}
                      onClick={() => goTo(action.path)}
                    >
                      <span
                        className={`dashboard-quick-icon ${action.color}`}
                      >
                        <Icon size={19} />
                      </span>

                      <span className="quick-action-text">
                        <strong>{action.title}</strong>
                        <small>
                          {action.description}
                        </small>
                      </span>

                      <Plus size={17} />
                    </button>
                  );
                })}
              </div>
            </article>
          </section>

          {/* OVERVIEW + SYSTEM */}

          <section className="dashboard-bottom-grid">
            <article className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h4>Clinic Overview</h4>
                  <p>
                    Current operational snapshot
                  </p>
                </div>

                <span className="dashboard-live-badge">
                  <span />
                  Live
                </span>
              </div>

              <div className="dashboard-overview-grid">
                <div className="overview-blue">
                  <span>Completed Visits</span>

                  <strong>
                    {loading
                      ? "..."
                      : dashboardStats?.appointments
                          ?.completed ?? 0}
                  </strong>

                  <small>All time</small>
                </div>

                <div className="overview-green">
                  <span>Waiting / Scheduled</span>

                  <strong>
                    {loading
                      ? "..."
                      : dashboardStats?.appointments
                          ?.scheduled ?? 0}
                  </strong>

                  <small>Current</small>
                </div>

                <div className="overview-purple">
                  <span>Low Stock Items</span>

                  <strong>
                    {loading
                      ? "..."
                      : dashboardStats?.inventory
                          ?.lowStock ?? 0}
                  </strong>

                  <small>Needs attention</small>
                </div>

                <div className="overview-orange">
                  <span>Pending Bills</span>

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

            <article className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h4>System Status</h4>
                  <p>Application services</p>
                </div>
              </div>

              <div className="dashboard-system-status">
                <div>
                  <span className="system-status-dot green" />
                  <span>Backend API</span>
                  <strong>Online</strong>
                </div>

                <div>
                  <span className="system-status-dot blue" />
                  <span>Database</span>
                  <strong>Connected</strong>
                </div>

                <div>
                  <span className="system-status-dot purple" />
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