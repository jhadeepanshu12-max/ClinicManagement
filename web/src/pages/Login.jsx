import { useState } from "react";
import { Activity, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import "./Login.css";

const Login = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        {
          email,
          password,
        }
      );

      const { token, user } = response.data.data;

      localStorage.setItem("clinic_token", token);
      localStorage.setItem("clinic_user", JSON.stringify(user));

      navigate("/dashboard");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Unable to login. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-decoration login-decoration-one" />
      <div className="login-decoration login-decoration-two" />

      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">
            <Activity size={26} strokeWidth={2.5} />
          </div>

          <div>
            <h1>CareSync</h1>
            <p>Clinic Management</p>
          </div>
        </div>

        <div className="login-heading">
          <h2>Welcome back 👋</h2>
          <p>
            Sign in to access your clinic management dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email address</label>

            <div className="input-wrapper">
              <Mail size={18} />

              <input
                id="email"
                type="email"
                placeholder="admin@clinic.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="password-label-row">
              <label htmlFor="password">Password</label>

              <button
                type="button"
                className="forgot-button"
                onClick={() =>
                  alert("Please contact your clinic administrator.")
                }
              >
                Forgot password?
              </button>
            </div>

            <div className="input-wrapper">
              <LockKeyhole size={18} />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in to CareSync"}
          </button>
        </form>

        <div className="login-footer">
          <span>Secure clinic management</span>
          <span>•</span>
          <span>Powered by CareSync</span>
        </div>
      </div>
    </div>
  );
};

export default Login;