import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserManagement.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "doctor",
};

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("clinic_user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

const UserManagement = () => {
  const navigate = useNavigate();

  const [currentUser] = useState(getStoredUser);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");

  const [selectedUser, setSelectedUser] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [resetPassword, setResetPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const [message, setMessage] = useState("");
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
    if (!token || !currentUser) {
      navigate("/role-selection", { replace: true });
      return;
    }

    if (currentUser.role !== "admin") {
      if (currentUser.role === "doctor") {
        navigate("/doctor-dashboard", { replace: true });
      } else if (currentUser.role === "receptionist") {
        navigate("/staff-dashboard", { replace: true });
      } else if (currentUser.role === "patient") {
        navigate("/patient-dashboard", { replace: true });
      } else {
        navigate("/role-selection", { replace: true });
      }

      return;
    }

    fetchUsers();
  }, [currentUser, navigate, token]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/user-management`,
        {
          headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load users."
        );
      }

      setUsers(
        data.data?.users ||
          data.users ||
          data.data ||
          []
      );
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(
        err.message || "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchValue = search.trim().toLowerCase();

    const matchesSearch =
      !searchValue ||
      user.name?.toLowerCase().includes(searchValue) ||
      user.email?.toLowerCase().includes(searchValue) ||
      user.phone?.toLowerCase().includes(searchValue);

    const matchesRole =
      roleFilter === "all" ||
      user.role === roleFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.isActive !== false) ||
      (statusFilter === "inactive" && user.isActive === false);

    return (
      matchesSearch &&
      matchesRole &&
      matchesStatus
    );
  });

  const totalDoctors = users.filter(
    (user) => user.role === "doctor"
  ).length;

  const totalStaff = users.filter(
    (user) => user.role === "receptionist"
  ).length;

  const activeUsers = users.filter(
    (user) => user.isActive !== false
  ).length;

  const inactiveUsers = users.filter(
    (user) => user.isActive === false
  ).length;

  const openCreateModal = (role = "doctor") => {
    setModalMode("create");
    setSelectedUser(null);

    setForm({
      ...EMPTY_FORM,
      role,
    });

    setResetPassword("");
    setMessage("");
    setError("");
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setModalMode("edit");
    setSelectedUser(user);

    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      role: user.role || "doctor",
    });

    setResetPassword("");
    setMessage("");
    setError("");
    setShowModal(true);
  };

  const openResetPasswordModal = (user) => {
    setModalMode("password");
    setSelectedUser(user);
    setResetPassword("");
    setMessage("");
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setSelectedUser(null);
    setForm(EMPTY_FORM);
    setResetPassword("");
    setMessage("");
    setError("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!form.name.trim()) {
        throw new Error("Name is required.");
      }

      if (!form.email.trim()) {
        throw new Error("Email is required.");
      }

      if (!form.password) {
        throw new Error(
          "Password is required for a new account."
        );
      }

      if (form.password.length < 6) {
        throw new Error(
          "Password must be at least 6 characters."
        );
      }

      const response = await fetch(
        `${API_URL}/user-management`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            password: form.password,
            role: form.role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to create account."
        );
      }

      setMessage(
        `${
          form.role === "doctor"
            ? "Doctor"
            : "Staff"
        } account created successfully.`
      );

      await fetchUsers();

      setTimeout(() => {
        closeModal();
      }, 700);
    } catch (err) {
      console.error("Create user error:", err);
      setError(
        err.message ||
          "Unable to create account."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!selectedUser?._id) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!form.name.trim()) {
        throw new Error("Name is required.");
      }

      if (!form.email.trim()) {
        throw new Error("Email is required.");
      }

      const response = await fetch(
        `${API_URL}/user-management/${selectedUser._id}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            role: form.role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update account."
        );
      }

      setMessage(
        "Account updated successfully."
      );

      await fetchUsers();

      setTimeout(() => {
        closeModal();
      }, 700);
    } catch (err) {
      console.error("Update user error:", err);
      setError(
        err.message ||
          "Unable to update account."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (!selectedUser?._id) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!resetPassword) {
        throw new Error(
          "Please enter a new password."
        );
      }

      if (resetPassword.length < 6) {
        throw new Error(
          "Password must be at least 6 characters."
        );
      }

      const response = await fetch(
        `${API_URL}/user-management/${selectedUser._id}/reset-password`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            password: resetPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to reset password."
        );
      }

      setMessage(
        "Password reset successfully."
      );

      setTimeout(() => {
        closeModal();
      }, 700);
    } catch (err) {
      console.error(
        "Reset password error:",
        err
      );

      setError(
        err.message ||
          "Unable to reset password."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleUserStatus = async (user) => {
    if (!user?._id) {
      return;
    }

    const actionText =
      user.isActive === false
        ? "activate"
        : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} ${user.name}'s account?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(user._id);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/user-management/${user._id}/status`,
        {
          method: "PATCH",
          headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Unable to ${actionText} account.`
        );
      }

      setMessage(
        `${
          user.name
        }'s account has been ${
          user.isActive === false
            ? "activated"
            : "deactivated"
        }.`
      );

      await fetchUsers();
    } catch (err) {
      console.error(
        "Toggle status error:",
        err
      );

      setError(
        err.message ||
          `Unable to ${actionText} account.`
      );
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleLabel = (role) => {
    if (role === "doctor") {
      return "Doctor";
    }

    if (role === "receptionist") {
      return "Staff";
    }

    return role;
  };

  const getInitials = (name) => {
    if (!name) {
      return "U";
    }

    const parts = name.trim().split(" ");

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem("clinic_token");
    localStorage.removeItem("clinic_user");
    localStorage.removeItem(
      "authenticated_role"
    );
    localStorage.removeItem(
      "selected_login_role"
    );

    navigate("/role-selection", {
      replace: true,
    });
  };

  if (!currentUser || currentUser.role !== "admin") {
    return null;
  }

  return (
    <div className="user-management-page">

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="um-sidebar">

        <div className="um-brand">

          <div className="um-brand-icon">
            +
          </div>

          <div>
            <h2>CareSync</h2>
            <span>Admin Portal</span>
          </div>

        </div>

        <nav className="um-nav">

          <button
            className="um-nav-item"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className="um-nav-item"
            onClick={() =>
              navigate("/patients")
            }
          >
            <span>♙</span>
            Patients
          </button>

          <button
            className="um-nav-item"
            onClick={() =>
              navigate("/doctors")
            }
          >
            <span>⚕</span>
            Doctors
          </button>

          <button
            className="um-nav-item"
            onClick={() =>
              navigate("/appointments")
            }
          >
            <span>▣</span>
            Appointments
          </button>

          <button
            className="um-nav-item"
            onClick={() =>
              navigate("/billing")
            }
          >
            <span>₹</span>
            Billing
          </button>

          <button
            className="um-nav-item"
            onClick={() =>
              navigate("/inventory")
            }
          >
            <span>▤</span>
            Inventory
          </button>

          <button
            className="um-nav-item"
            onClick={() =>
              navigate("/expenses")
            }
          >
            <span>◈</span>
            Expenses
          </button>

          <button
            className="um-nav-item active"
          >
            <span>♙</span>
            User Management
          </button>

          <button
            className="um-nav-item"
            onClick={() =>
              navigate("/settings")
            }
          >
            <span>⚙</span>
            Settings
          </button>

        </nav>

        <div className="um-sidebar-bottom">

          <button
            className="um-nav-item"
            onClick={() =>
              navigate("/settings")
            }
          >
            <span>⚙</span>
            Settings
          </button>

          <button
            className="um-logout"
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

      <main className="um-main">

        <header className="um-header">

          <div>

            <p className="um-header-label">
              ADMIN PORTAL
            </p>

            <h1>
              User Management
            </h1>

            <p>
              Manage doctor and staff accounts
              for your clinic.
            </p>

          </div>

          <div className="um-header-actions">

            <button
              className="um-secondary-button"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              ← Dashboard
            </button>

            <div className="um-profile">

              <div className="um-avatar">
                {getInitials(
                  currentUser.name
                )}
              </div>

              <div>
                <strong>
                  {currentUser.name}
                </strong>

                <span>
                  Administrator
                </span>
              </div>

            </div>

          </div>

        </header>

        {/* =========================
            ALERTS
        ========================= */}

        {message && (
          <div className="um-success">
            <span>✓</span>
            {message}
          </div>
        )}

        {error && (
          <div className="um-error">
            <span>!</span>
            {error}
          </div>
        )}

        {/* =========================
            STATS
        ========================= */}

        <section className="um-stats">

          <div className="um-stat-card">

            <div className="um-stat-icon doctor">
              ⚕
            </div>

            <div>
              <span>Total Doctors</span>
              <strong>
                {loading ? "—" : totalDoctors}
              </strong>
            </div>

          </div>

          <div className="um-stat-card">

            <div className="um-stat-icon staff">
              ♙
            </div>

            <div>
              <span>Total Staff</span>
              <strong>
                {loading ? "—" : totalStaff}
              </strong>
            </div>

          </div>

          <div className="um-stat-card">

            <div className="um-stat-icon active">
              ✓
            </div>

            <div>
              <span>Active Accounts</span>
              <strong>
                {loading ? "—" : activeUsers}
              </strong>
            </div>

          </div>

          <div className="um-stat-card">

            <div className="um-stat-icon inactive">
              ◷
            </div>

            <div>
              <span>Inactive Accounts</span>
              <strong>
                {loading ? "—" : inactiveUsers}
              </strong>
            </div>

          </div>

        </section>

        {/* =========================
            TOOLBAR
        ========================= */}

        <section className="um-toolbar">

          <div className="um-search-box">

            <span>⌕</span>

            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            {search && (
              <button
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}

          </div>

          <select
            className="um-filter"
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value)
            }
          >
            <option value="all">
              All Roles
            </option>

            <option value="doctor">
              Doctors
            </option>

            <option value="receptionist">
              Staff
            </option>
          </select>

          <select
            className="um-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="all">
              All Status
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>
          </select>

          <button
            className="um-add-button"
            onClick={() =>
              openCreateModal("doctor")
            }
          >
            + Add User
          </button>

        </section>

        {/* =========================
            TABLE
        ========================= */}

        <section className="um-table-card">

          <div className="um-table-header">

            <div>
              <h2>
                Doctors & Staff
              </h2>

              <p>
                {filteredUsers.length} account
                {filteredUsers.length !== 1
                  ? "s"
                  : ""}{" "}
                displayed
              </p>
            </div>

            <button
              className="um-refresh-button"
              onClick={fetchUsers}
              disabled={loading}
            >
              ↻ Refresh
            </button>

          </div>

          {loading ? (
            <div className="um-empty-state">
              <div className="um-loader" />
              <h3>
                Loading accounts...
              </h3>
              <p>
                Please wait while we fetch
                users.
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="um-empty-state">

              <div className="um-empty-icon">
                ♙
              </div>

              <h3>
                No users found
              </h3>

              <p>
                Try changing your search or
                filters.
              </p>

            </div>
          ) : (
            <div className="um-table-wrapper">

              <table className="um-table">

                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredUsers.map((user) => (
                    <tr key={user._id}>

                      <td>
                        <div className="um-user-cell">

                          <div
                            className={`um-user-avatar ${
                              user.role === "doctor"
                                ? "doctor"
                                : "staff"
                            }`}
                          >
                            {getInitials(
                              user.name
                            )}
                          </div>

                          <div>
                            <strong>
                              {user.name}
                            </strong>

                            <span>
                              {user.email}
                            </span>
                          </div>

                        </div>
                      </td>

                      <td>
                        <span
                          className={`um-role-badge ${
                            user.role
                          }`}
                        >
                          {getRoleLabel(
                            user.role
                          )}
                        </span>
                      </td>

                      <td>
                        <div className="um-contact">

                          <span>
                            {user.phone ||
                              "No phone"}
                          </span>

                        </div>
                      </td>

                      <td>
                        <span
                          className={`um-status ${
                            user.isActive === false
                              ? "inactive"
                              : "active"
                          }`}
                        >
                          <i />
                          {user.isActive === false
                            ? "Inactive"
                            : "Active"}
                        </span>
                      </td>

                      <td>
                        <span className="um-created">
                          {user.createdAt
                            ? new Date(
                                user.createdAt
                              ).toLocaleDateString(
                                [],
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "—"}
                        </span>
                      </td>

                      <td>

                        <div className="um-actions">

                          <button
                            className="um-action edit"
                            title="Edit user"
                            onClick={() =>
                              openEditModal(user)
                            }
                          >
                            ✎
                          </button>

                          <button
                            className="um-action password"
                            title="Reset password"
                            onClick={() =>
                              openResetPasswordModal(
                                user
                              )
                            }
                          >
                            🔑
                          </button>

                          <button
                            className={`um-action ${
                              user.isActive === false
                                ? "activate"
                                : "deactivate"
                            }`}
                            title={
                              user.isActive === false
                                ? "Activate user"
                                : "Deactivate user"
                            }
                            onClick={() =>
                              toggleUserStatus(
                                user
                              )
                            }
                            disabled={
                              actionLoading ===
                              user._id
                            }
                          >
                            {actionLoading ===
                            user._id
                              ? "..."
                              : user.isActive ===
                                false
                              ? "✓"
                              : "⊘"}
                          </button>

                        </div>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* =========================
            ADD USER BUTTONS
        ========================= */}

        <section className="um-create-section">

          <div>
            <h2>
              Create a new account
            </h2>

            <p>
              Add clinic doctors or reception
              staff and provide them their
              login credentials.
            </p>
          </div>

          <div className="um-create-buttons">

            <button
              className="um-create-card doctor"
              onClick={() =>
                openCreateModal("doctor")
              }
            >
              <span>⚕</span>

              <div>
                <strong>
                  Add Doctor
                </strong>

                <small>
                  Create a doctor account
                </small>
              </div>

              <b>→</b>
            </button>

            <button
              className="um-create-card staff"
              onClick={() =>
                openCreateModal(
                  "receptionist"
                )
              }
            >
              <span>♙</span>

              <div>
                <strong>
                  Add Staff
                </strong>

                <small>
                  Create a receptionist account
                </small>
              </div>

              <b>→</b>
            </button>

          </div>

        </section>

        <footer className="um-footer">
          <span>
            CareSync Clinic Management
          </span>

          <span>
            Admin User Management
          </span>
        </footer>

      </main>

      {/* =========================
          MODAL
      ========================= */}

      {showModal && (
        <div
          className="um-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div className="um-modal">

            <div className="um-modal-header">

              <div>
                <p>
                  {modalMode === "create"
                    ? "NEW ACCOUNT"
                    : modalMode === "edit"
                    ? "EDIT ACCOUNT"
                    : "SECURITY"}
                </p>

                <h2>
                  {modalMode === "create"
                    ? `Add ${
                        form.role === "doctor"
                          ? "Doctor"
                          : "Staff"
                      }`
                    : modalMode === "edit"
                    ? "Edit Account"
                    : "Reset Password"}
                </h2>
              </div>

              <button
                className="um-close"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>

            </div>

            {modalMode === "password" ? (
              <form
                className="um-modal-form"
                onSubmit={
                  handleResetPassword
                }
              >

                <div className="um-user-preview">

                  <div className="um-user-avatar doctor">
                    {getInitials(
                      selectedUser?.name
                    )}
                  </div>

                  <div>
                    <strong>
                      {selectedUser?.name}
                    </strong>

                    <span>
                      {selectedUser?.email}
                    </span>
                  </div>

                </div>

                <label>
                  New Password

                  <input
                    type="password"
                    value={resetPassword}
                    onChange={(event) =>
                      setResetPassword(
                        event.target.value
                      )
                    }
                    placeholder="Enter new password"
                    minLength={6}
                    required
                  />
                </label>

                <p className="um-password-note">
                  Password must contain at
                  least 6 characters.
                </p>

                {error && (
                  <div className="um-modal-error">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="um-modal-success">
                    {message}
                  </div>
                )}

                <div className="um-modal-actions">

                  <button
                    type="button"
                    className="um-cancel"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="um-save"
                    disabled={saving}
                  >
                    {saving
                      ? "Updating..."
                      : "Reset Password"}
                  </button>

                </div>

              </form>
            ) : (
              <form
                className="um-modal-form"
                onSubmit={
                  modalMode === "create"
                    ? handleCreate
                    : handleUpdate
                }
              >

                <div className="um-form-grid">

                  <label>
                    Full Name

                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={
                        handleFormChange
                      }
                      placeholder="Enter full name"
                      required
                    />
                  </label>

                  <label>
                    Email Address

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={
                        handleFormChange
                      }
                      placeholder="name@clinic.com"
                      required
                    />
                  </label>

                  <label>
                    Phone Number

                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={
                        handleFormChange
                      }
                      placeholder="Enter phone number"
                    />
                  </label>

                  <label>
                    Role

                    <select
                      name="role"
                      value={form.role}
                      onChange={
                        handleFormChange
                      }
                    >
                      <option value="doctor">
                        Doctor
                      </option>

                      <option value="receptionist">
                        Staff / Receptionist
                      </option>
                    </select>
                  </label>

                </div>

                {modalMode === "create" && (
                  <label>
                    Login Password

                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={
                        handleFormChange
                      }
                      placeholder="Create login password"
                      minLength={6}
                      required
                    />

                    <small>
                      The user will use this
                      password to log in.
                    </small>
                  </label>
                )}

                {error && (
                  <div className="um-modal-error">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="um-modal-success">
                    {message}
                  </div>
                )}

                <div className="um-modal-actions">

                  <button
                    type="button"
                    className="um-cancel"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="um-save"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : modalMode === "create"
                      ? "Create Account"
                      : "Save Changes"}
                  </button>

                </div>

              </form>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

export default UserManagement;