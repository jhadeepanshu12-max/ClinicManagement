import { useEffect, useState } from "react";
import {
  User,
  Lock,
  Bell,
  Building2,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import axios from "axios";

import "./Settings.css";

const API_URL = import.meta.env.VITE_API_URL;

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("clinic_user")) || {};
    } catch {
      return {};
    }
  });

  const [profile, setProfile] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [clinic, setClinic] = useState({
    name: localStorage.getItem("clinic_name") || "MediCare Clinic",
    address: localStorage.getItem("clinic_address") || "",
    phone: localStorage.getItem("clinic_phone") || "",
    email: localStorage.getItem("clinic_email") || "",
  });

  const [notifications, setNotifications] = useState({
    appointmentReminders:
      localStorage.getItem("notification_appointments") !== "false",
    paymentAlerts:
      localStorage.getItem("notification_payments") !== "false",
    lowStockAlerts:
      localStorage.getItem("notification_inventory") !== "false",
    systemNotifications:
      localStorage.getItem("notification_system") !== "false",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setProfile({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
    });
  }, [user]);

  const getToken = () => localStorage.getItem("clinic_token");

  const showSuccess = (text) => {
    setMessage(text);
    setError("");

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  const showError = (text) => {
    setError(text);
    setMessage("");

    setTimeout(() => {
      setError("");
    }, 4000);
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswords((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleClinicChange = (event) => {
    const { name, value } = event.target;

    setClinic((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    if (!profile.name.trim()) {
      showError("Name is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.put(
        `${API_URL}/users/me`,
        {
          name: profile.name.trim(),
          phone: profile.phone.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const updatedUser = response.data?.data?.user || {
        ...user,
        name: profile.name.trim(),
        phone: profile.phone.trim(),
      };

      localStorage.setItem("clinic_user", JSON.stringify(updatedUser));

      setUser(updatedUser);

      showSuccess("Profile updated successfully.");
    } catch (requestError) {
      showError(
        requestError.response?.data?.message ||
          "Unable to update profile."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (!passwords.currentPassword) {
      showError("Please enter your current password.");
      return;
    }

    if (passwords.newPassword.length < 6) {
      showError("New password must contain at least 6 characters.");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      showError("New password and confirm password do not match.");
      return;
    }

    setLoading(true);

    try {
      await axios.put(
        `${API_URL}/users/change-password`,
        {
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      showSuccess("Password changed successfully.");
    } catch (requestError) {
      showError(
        requestError.response?.data?.message ||
          "Unable to change password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClinicSubmit = (event) => {
    event.preventDefault();

    localStorage.setItem("clinic_name", clinic.name);
    localStorage.setItem("clinic_address", clinic.address);
    localStorage.setItem("clinic_phone", clinic.phone);
    localStorage.setItem("clinic_email", clinic.email);

    showSuccess("Clinic information saved successfully.");
  };

  const handleNotificationsSubmit = (event) => {
    event.preventDefault();

    localStorage.setItem(
      "notification_appointments",
      String(notifications.appointmentReminders)
    );

    localStorage.setItem(
      "notification_payments",
      String(notifications.paymentAlerts)
    );

    localStorage.setItem(
      "notification_inventory",
      String(notifications.lowStockAlerts)
    );

    localStorage.setItem(
      "notification_system",
      String(notifications.systemNotifications)
    );

    showSuccess("Notification preferences saved successfully.");
  };

  const tabs = [
    {
      id: "profile",
      label: "Profile",
      icon: User,
    },
    {
      id: "security",
      label: "Security",
      icon: Lock,
    },
    {
      id: "clinic",
      label: "Clinic Information",
      icon: Building2,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
    },
  ];

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your account and clinic preferences</p>
        </div>
      </div>

      {message && (
        <div className="settings-alert success">
          <CheckCircle2 size={19} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="settings-alert error">
          <AlertCircle size={19} />
          <span>{error}</span>
        </div>
      )}

      <div className="settings-layout">
        <aside className="settings-sidebar">
          <div className="settings-user-card">
            <div className="settings-avatar">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div>
              <strong>{user.name || "User"}</strong>
              <span>{user.role || "Staff"}</span>
            </div>
          </div>

          <div className="settings-tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  className={`settings-tab ${
                    activeTab === tab.id ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMessage("");
                    setError("");
                  }}
                >
                  <Icon size={19} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="settings-content">
          {activeTab === "profile" && (
            <section className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2>Profile Settings</h2>
                  <p>Update your personal information</p>
                </div>
                <User size={24} />
              </div>

              <form onSubmit={handleProfileSubmit}>
                <div className="settings-form-grid">
                  <div className="settings-field">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={profile.name}
                      onChange={handleProfileChange}
                      placeholder="Enter your name"
                    />
                  </div>

                  <div className="settings-field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                    />
                    <small>Email cannot be changed from here.</small>
                  </div>

                  <div className="settings-field">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={profile.phone}
                      onChange={handleProfileChange}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="settings-field">
                    <label>Role</label>
                    <input
                      type="text"
                      value={user.role || ""}
                      disabled
                    />
                  </div>
                </div>

                <div className="settings-actions">
                  <button
                    type="submit"
                    className="settings-primary-btn"
                    disabled={loading}
                  >
                    <Save size={18} />
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {activeTab === "security" && (
            <section className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2>Security</h2>
                  <p>Keep your account secure</p>
                </div>
                <Lock size={24} />
              </div>

              <form onSubmit={handlePasswordSubmit}>
                <div className="settings-password-fields">
                  <div className="settings-field">
                    <label>Current Password</label>

                    <div className="password-input-wrapper">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        name="currentPassword"
                        value={passwords.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter current password"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(
                            (previous) => !previous
                          )
                        }
                      >
                        {showCurrentPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="settings-field">
                    <label>New Password</label>

                    <div className="password-input-wrapper">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        value={passwords.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Minimum 6 characters"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowNewPassword(
                            (previous) => !previous
                          )
                        }
                      >
                        {showNewPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="settings-field">
                    <label>Confirm New Password</label>

                    <div className="password-input-wrapper">
                      <input
                        type={
                          showConfirmPassword ? "text" : "password"
                        }
                        name="confirmPassword"
                        value={passwords.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Confirm new password"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            (previous) => !previous
                          )
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="settings-security-note">
                  <Lock size={18} />
                  <span>
                    Use a strong password that you do not reuse on
                    other accounts.
                  </span>
                </div>

                <div className="settings-actions">
                  <button
                    type="submit"
                    className="settings-primary-btn"
                    disabled={loading}
                  >
                    <Lock size={18} />
                    {loading ? "Updating..." : "Change Password"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {activeTab === "clinic" && (
            <section className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2>Clinic Information</h2>
                  <p>Manage your clinic details</p>
                </div>
                <Building2 size={24} />
              </div>

              <form onSubmit={handleClinicSubmit}>
                <div className="settings-form-grid">
                  <div className="settings-field">
                    <label>Clinic Name</label>
                    <input
                      type="text"
                      name="name"
                      value={clinic.name}
                      onChange={handleClinicChange}
                      placeholder="Enter clinic name"
                    />
                  </div>

                  <div className="settings-field">
                    <label>Clinic Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={clinic.phone}
                      onChange={handleClinicChange}
                      placeholder="Enter clinic phone"
                    />
                  </div>

                  <div className="settings-field full-width">
                    <label>Clinic Email</label>
                    <input
                      type="email"
                      name="email"
                      value={clinic.email}
                      onChange={handleClinicChange}
                      placeholder="clinic@example.com"
                    />
                  </div>

                  <div className="settings-field full-width">
                    <label>Clinic Address</label>
                    <textarea
                      name="address"
                      value={clinic.address}
                      onChange={handleClinicChange}
                      placeholder="Enter complete clinic address"
                      rows="4"
                    />
                  </div>
                </div>

                <div className="settings-actions">
                  <button
                    type="submit"
                    className="settings-primary-btn"
                  >
                    <Save size={18} />
                    Save Clinic Information
                  </button>
                </div>
              </form>
            </section>
          )}

          {activeTab === "notifications" && (
            <section className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2>Notification Preferences</h2>
                  <p>Choose which alerts you want to receive</p>
                </div>
                <Bell size={24} />
              </div>

              <form onSubmit={handleNotificationsSubmit}>
                <div className="notification-list">
                  <label className="notification-item">
                    <div>
                      <strong>Appointment Reminders</strong>
                      <span>
                        Receive reminders about upcoming appointments
                      </span>
                    </div>

                    <input
                      type="checkbox"
                      checked={notifications.appointmentReminders}
                      onChange={(event) =>
                        setNotifications((previous) => ({
                          ...previous,
                          appointmentReminders:
                            event.target.checked,
                        }))
                      }
                    />
                  </label>

                  <label className="notification-item">
                    <div>
                      <strong>Payment Alerts</strong>
                      <span>
                        Get notified about pending and received payments
                      </span>
                    </div>

                    <input
                      type="checkbox"
                      checked={notifications.paymentAlerts}
                      onChange={(event) =>
                        setNotifications((previous) => ({
                          ...previous,
                          paymentAlerts: event.target.checked,
                        }))
                      }
                    />
                  </label>

                  <label className="notification-item">
                    <div>
                      <strong>Low Stock Alerts</strong>
                      <span>
                        Receive alerts when inventory reaches reorder level
                      </span>
                    </div>

                    <input
                      type="checkbox"
                      checked={notifications.lowStockAlerts}
                      onChange={(event) =>
                        setNotifications((previous) => ({
                          ...previous,
                          lowStockAlerts: event.target.checked,
                        }))
                      }
                    />
                  </label>

                  <label className="notification-item">
                    <div>
                      <strong>System Notifications</strong>
                      <span>
                        Receive important system and account notifications
                      </span>
                    </div>

                    <input
                      type="checkbox"
                      checked={notifications.systemNotifications}
                      onChange={(event) =>
                        setNotifications((previous) => ({
                          ...previous,
                          systemNotifications:
                            event.target.checked,
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="settings-actions">
                  <button
                    type="submit"
                    className="settings-primary-btn"
                  >
                    <Save size={18} />
                    Save Preferences
                  </button>
                </div>
              </form>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default Settings;