import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import "../Login.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const PatientRegister = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    bloodGroup: "unknown",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelationship: "",
    medicalHistory: "",
    allergies: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.password ||
      !formData.dateOfBirth ||
      !formData.gender
    ) {
      setError("Please fill all required fields.");
      return;
    }

    if (formData.password.length < 6) {
      setError(
        "Password must be at least 6 characters long."
      );
      return;
    }

    try {
      setLoading(true);

      const allergies = formData.allergies
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address.trim(),
        bloodGroup: formData.bloodGroup,
        emergencyContact: {
          name: formData.emergencyName.trim(),
          phone: formData.emergencyPhone.trim(),
          relationship:
            formData.emergencyRelationship.trim(),
        },
        medicalHistory:
          formData.medicalHistory.trim(),
        allergies,
      };

      const response = await fetch(
        `${API_URL}/patient-auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to create patient account."
        );
      }

      const { token, user } = result.data || {};

      if (!token || !user) {
        throw new Error(
          "Registration succeeded but login information was not received."
        );
      }

      localStorage.setItem(
        "clinic_token",
        token
      );

      localStorage.setItem(
        "clinic_user",
        JSON.stringify(user)
      );

      localStorage.setItem(
        "authenticated_role",
        user.role
      );

      sessionStorage.removeItem(
        "selected_login_role"
      );

      setSuccess(
        "Account created successfully. Redirecting..."
      );

      setTimeout(() => {
        navigate("/patient-dashboard", {
          replace: true,
        });
      }, 700);
    } catch (registrationError) {
      console.error(
        "Patient registration error:",
        registrationError
      );

      setError(
        registrationError.message ||
          "Something went wrong while creating your account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background-glow login-glow-one"></div>
      <div className="login-background-glow login-glow-two"></div>

      <main
        className="login-container"
        style={{
          maxWidth: "920px",
        }}
      >
        <div className="login-brand">
          <div className="login-logo">
            <span>+</span>
          </div>

          <div>
            <h1>CareSync</h1>
            <p>Clinic Management</p>
          </div>
        </div>

        <div className="login-heading">
          <span className="login-eyebrow">
            PATIENT PORTAL
          </span>

          <h2>Create your account</h2>

          <p>
            Register as a patient to manage
            appointments, medical records,
            prescriptions and bills.
          </p>
        </div>

        {error && (
          <div
            style={{
              marginBottom: "18px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#fff1f2",
              color: "#be123c",
              border: "1px solid #fecdd3",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              marginBottom: "18px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#f0fdf4",
              color: "#15803d",
              border: "1px solid #bbf7d0",
              fontSize: "14px",
            }}
          >
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <section
            style={{
              padding: "22px",
              borderRadius: "16px",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
            }}
          >
            <h3
              style={{
                margin: "0 0 18px",
                fontSize: "18px",
                color: "#111827",
              }}
            >
              Personal Information
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >
              <div className="login-field">
                <label htmlFor="name">
                  Full Name *
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="login-field">
                <label htmlFor="email">
                  Email Address *
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="login-field">
                <label htmlFor="phone">
                  Phone Number *
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  required
                />
              </div>

              <div className="login-field">
                <label htmlFor="password">
                  Password *
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>

              <div className="login-field">
                <label htmlFor="dateOfBirth">
                  Date of Birth *
                </label>

                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="login-field">
                <label htmlFor="gender">
                  Gender *
                </label>

                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select gender
                  </option>
                  <option value="male">
                    Male
                  </option>
                  <option value="female">
                    Female
                  </option>
                  <option value="other">
                    Other
                  </option>
                </select>
              </div>

              <div className="login-field">
                <label htmlFor="bloodGroup">
                  Blood Group
                </label>

                <select
                  id="bloodGroup"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                >
                  <option value="unknown">
                    Unknown
                  </option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="login-field">
                <label htmlFor="address">
                  Address
                </label>

                <input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="Enter your address"
                  value={formData.address}
                  onChange={handleChange}
                  autoComplete="street-address"
                />
              </div>
            </div>
          </section>

          <section
            style={{
              padding: "22px",
              borderRadius: "16px",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
            }}
          >
            <h3
              style={{
                margin: "0 0 18px",
                fontSize: "18px",
                color: "#111827",
              }}
            >
              Emergency Contact
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >
              <div className="login-field">
                <label htmlFor="emergencyName">
                  Contact Name
                </label>

                <input
                  id="emergencyName"
                  name="emergencyName"
                  type="text"
                  placeholder="Emergency contact name"
                  value={formData.emergencyName}
                  onChange={handleChange}
                />
              </div>

              <div className="login-field">
                <label htmlFor="emergencyPhone">
                  Contact Phone
                </label>

                <input
                  id="emergencyPhone"
                  name="emergencyPhone"
                  type="tel"
                  placeholder="Emergency contact number"
                  value={formData.emergencyPhone}
                  onChange={handleChange}
                />
              </div>

              <div className="login-field">
                <label htmlFor="emergencyRelationship">
                  Relationship
                </label>

                <input
                  id="emergencyRelationship"
                  name="emergencyRelationship"
                  type="text"
                  placeholder="e.g. Father, Mother"
                  value={
                    formData.emergencyRelationship
                  }
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          <section
            style={{
              padding: "22px",
              borderRadius: "16px",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
            }}
          >
            <h3
              style={{
                margin: "0 0 18px",
                fontSize: "18px",
                color: "#111827",
              }}
            >
              Medical Information
            </h3>

            <div
              style={{
                display: "grid",
                gap: "16px",
              }}
            >
              <div className="login-field">
                <label htmlFor="medicalHistory">
                  Medical History
                </label>

                <textarea
                  id="medicalHistory"
                  name="medicalHistory"
                  placeholder="Mention any important medical history"
                  value={formData.medicalHistory}
                  onChange={handleChange}
                  rows={4}
                  style={{
                    width: "100%",
                    resize: "vertical",
                  }}
                />
              </div>

              <div className="login-field">
                <label htmlFor="allergies">
                  Allergies
                </label>

                <input
                  id="allergies"
                  name="allergies"
                  type="text"
                  placeholder="Separate multiple allergies with commas"
                  value={formData.allergies}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <UserPlus size={18} />

            {loading
              ? "Creating Account..."
              : "Create Patient Account"}
          </button>
        </form>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "16px",
            flexWrap: "wrap",
            marginTop: "22px",
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/login")}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              color: "#475569",
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} />
            Back to Login
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/role-selection")
            }
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#475569",
              fontWeight: 600,
            }}
          >
            Change Portal
          </button>
        </div>

        <div className="login-security">
          <ShieldCheck size={17} />

          <span>
            Your personal information is securely
            handled by the CareSync clinic portal.
          </span>
        </div>

        <p className="login-footer">
          © {new Date().getFullYear()} CareSync
          <span> • </span>
          Secure Clinic Management
        </p>
      </main>
    </div>
  );
};

export default PatientRegister;