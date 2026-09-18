import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import "./Login.css";

const roleConfig = {
  admin: {
    title: "Admin",
    description: "Clinic Administration",
    icon: ShieldCheck,
  },

  doctor: {
    title: "Doctor",
    description: "Clinical Care Portal",
    icon: Stethoscope,
  },

  staff: {
    title: "Staff",
    description: "Clinic Operations Portal",
    icon: Users,
  },

  patient: {
    title: "Patient",
    description: "Patient Care Portal",
    icon: UserRound,
  },
};

const Login = () => {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= GET SELECTED ROLE ================= */

  useEffect(() => {
    const role = sessionStorage.getItem(
      "selected_login_role"
    );

    if (!role || !roleConfig[role]) {
      navigate("/role-selection", {
        replace: true,
      });

      return;
    }

    setSelectedRole(role);
  }, [navigate]);

  /* ================= LOGIN ================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError(
        "Please enter your email address and password."
      );
      return;
    }

    if (!selectedRole) {
      setError(
        "Please select a portal before signing in."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        {
          email: email.trim().toLowerCase(),
          password,
        }
      );

      const token = response.data?.data?.token;
      const user = response.data?.data?.user;

      if (!token || !user) {
        setError(
          "Unable to complete sign in. Please try again."
        );
        return;
      }

      /*
       * Backend role:
       * receptionist
       *
       * Frontend portal:
       * staff
       */

      const actualRole =
        user.role === "receptionist"
          ? "staff"
          : user.role;

      /* ================= ROLE CHECK ================= */

      if (actualRole !== selectedRole) {
        setError(
          "The credentials you entered don't match the selected portal. Please check your details and try again."
        );

        return;
      }

      /* ================= SAVE AUTH ================= */

      localStorage.setItem(
        "clinic_token",
        token
      );

      localStorage.setItem(
        "clinic_user",
        JSON.stringify(user)
      );

      sessionStorage.setItem(
        "authenticated_role",
        actualRole
      );

      sessionStorage.removeItem(
        "selected_login_role"
      );

      /* ================= ROLE REDIRECT ================= */

      if (actualRole === "patient") {
        navigate("/patient-dashboard", {
          replace: true,
        });

        return;
      }

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error("Login error:", error);

      if (error.response?.status === 401) {
        setError(
          "Invalid email or password. Please check your credentials and try again."
        );
      } else {
        setError(
          error.response?.data?.message ||
            "Unable to login right now. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================= CHANGE PORTAL ================= */

  const handleChangePortal = () => {
    if (loading) {
      return;
    }

    setError("");
    setEmail("");
    setPassword("");
    setShowPassword(false);

    sessionStorage.removeItem(
      "selected_login_role"
    );

    navigate("/role-selection", {
      replace: true,
    });
  };

  /* ================= CREATE ACCOUNT ================= */

  const handleCreateAccount = () => {
    if (loading) {
      return;
    }

    navigate("/patient-register");
  };

  /* ================= LOADING ================= */

  if (!selectedRole) {
    return null;
  }

  const currentRole =
    roleConfig[selectedRole];

  const RoleIcon = currentRole.icon;

  /* ================= UI ================= */

  return (
    <div className="login-page">

      <div className="login-decoration login-decoration-one" />
      <div className="login-decoration login-decoration-two" />

      <div className="login-card">

        {/* Top navigation */}

        <button
          type="button"
          className="login-back-button"
          onClick={handleChangePortal}
          disabled={loading}
        >
          <ArrowLeft size={16} />

          <span>
            Change portal
          </span>
        </button>

        {/* Brand */}

        <div className="login-brand">

          <div className="login-brand-icon">
            <Activity
              size={26}
              strokeWidth={2.5}
            />
          </div>

          <div>
            <h1>CareSync</h1>
            <p>Clinic Management</p>
          </div>

        </div>

        {/* Selected portal */}

        <div className="selected-role">

          <div className="selected-role-icon">
            <RoleIcon size={20} />
          </div>

          <div className="selected-role-info">

            <span>
              Selected portal
            </span>

            <strong>
              {currentRole.title}
            </strong>

          </div>

          <button
            type="button"
            className="selected-role-change"
            onClick={handleChangePortal}
            disabled={loading}
          >
            Change
          </button>

        </div>

        {/* Heading */}

        <div className="login-heading">

          <h2>
            Welcome back <span>👋</span>
          </h2>

          <p>
            Sign in to your CareSync{" "}
            {currentRole.title.toLowerCase()}{" "}
            account.
          </p>

        </div>

        {/* Login form */}

        <form
          onSubmit={handleSubmit}
          className="login-form"
        >

          {/* Email */}

          <div className="form-group">

            <label htmlFor="email">
              Email address
            </label>

            <div className="input-wrapper">

              <Mail size={18} />

              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
                autoComplete="email"
                disabled={loading}
              />

            </div>

          </div>

          {/* Password */}

          <div className="form-group">

            <div className="password-label-row">

              <label htmlFor="password">
                Password
              </label>

              <button
                type="button"
                className="forgot-button"
                onClick={() =>
                  alert(
                    "Please contact your clinic administrator to reset your password."
                  )
                }
                disabled={loading}
              >
                Forgot password?
              </button>

            </div>

            <div className="input-wrapper">

              <LockKeyhole size={18} />

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
                autoComplete="current-password"
                disabled={loading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(
                    (value) => !value
                  )
                }
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>

            </div>

          </div>

          {/* Error */}

          {error && (
            <div
              className="login-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Submit */}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : `Sign in as ${currentRole.title}`}
          </button>

        </form>

        {/* Patient signup */}

        {selectedRole === "patient" && (
          <div className="signup-section">

            <span>
              New to CareSync?
            </span>

            <button
              type="button"
              className="signup-button"
              onClick={handleCreateAccount}
              disabled={loading}
            >
              Create patient account
            </button>

          </div>
        )}

        {/* Security */}

        <div className="login-security">

          <ShieldCheck size={16} />

          <span>
            Secure authentication with
            role-based access control
          </span>

        </div>

        {/* Footer */}

        <div className="login-footer">

          <span>
            Secure clinic management
          </span>

          <span>•</span>

          <span>
            Powered by CareSync
          </span>

        </div>

      </div>
    </div>
  );
};

export default Login;