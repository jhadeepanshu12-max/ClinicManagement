import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  ArrowLeft,
  ShieldCheck,
  UserRound,
  HeartPulse,
  Phone,
  Stethoscope,
  MapPin,
  LockKeyhole,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import "./PatientRegister.css";

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

    if (success) {
      setSuccess("");
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
    <div className="patient-register-page">
      <div className="patient-register-orb patient-register-orb-one"></div>
      <div className="patient-register-orb patient-register-orb-two"></div>
      <div className="patient-register-orb patient-register-orb-three"></div>

      <main className="patient-register-container">

        {/* Brand */}
        <div className="patient-register-brand">
          <div className="patient-register-logo">
            <span>+</span>
          </div>

          <div>
            <h1>CareSync</h1>
            <p>Clinic Management</p>
          </div>
        </div>

        {/* Header */}
        <div className="patient-register-heading">
          <div className="patient-register-eyebrow">
            <UserPlus size={15} />
            <span>PATIENT PORTAL</span>
          </div>

          <h2>Create your account</h2>

          <p>
            Join CareSync to manage your appointments,
            medical records, prescriptions and bills
            from one secure place.
          </p>
        </div>

        {/* Progress */}
        <div className="patient-register-progress">
          <div className="patient-progress-step active">
            <span>1</span>
            <small>Personal</small>
          </div>

          <div className="patient-progress-line"></div>

          <div className="patient-progress-step active">
            <span>2</span>
            <small>Emergency</small>
          </div>

          <div className="patient-progress-line"></div>

          <div className="patient-progress-step active">
            <span>3</span>
            <small>Medical</small>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="patient-register-alert error">
            <AlertCircle size={19} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="patient-register-alert success">
            <CheckCircle2 size={19} />
            <span>{success}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="patient-register-form"
        >

          {/* Personal Information */}
          <section className="patient-form-section">
            <div className="patient-section-heading">
              <div className="patient-section-icon">
                <UserRound size={20} />
              </div>

              <div>
                <h3>Personal Information</h3>
                <p>
                  Tell us a little about yourself
                </p>
              </div>
            </div>

            <div className="patient-form-grid">

              <div className="patient-field">
                <label htmlFor="name">
                  Full Name <span>*</span>
                </label>

                <div className="patient-input-wrapper">
                  <UserRound size={17} />
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
              </div>

              <div className="patient-field">
                <label htmlFor="email">
                  Email Address <span>*</span>
                </label>

                <div className="patient-input-wrapper">
                  <span className="patient-input-symbol">
                    @
                  </span>

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
              </div>

              <div className="patient-field">
                <label htmlFor="phone">
                  Phone Number <span>*</span>
                </label>

                <div className="patient-input-wrapper">
                  <Phone size={17} />

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
              </div>

              <div className="patient-field">
                <label htmlFor="password">
                  Password <span>*</span>
                </label>

                <div className="patient-input-wrapper">
                  <LockKeyhole size={17} />

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
              </div>

              <div className="patient-field">
                <label htmlFor="dateOfBirth">
                  Date of Birth <span>*</span>
                </label>

                <div className="patient-input-wrapper">
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="patient-field">
                <label htmlFor="gender">
                  Gender <span>*</span>
                </label>

                <div className="patient-input-wrapper">
                  <UserRound size={17} />

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
              </div>

              <div className="patient-field">
                <label htmlFor="bloodGroup">
                  Blood Group
                </label>

                <div className="patient-input-wrapper">
                  <HeartPulse size={17} />

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
              </div>

              <div className="patient-field">
                <label htmlFor="address">
                  Address
                </label>

                <div className="patient-input-wrapper">
                  <MapPin size={17} />

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

            </div>
          </section>

          {/* Emergency Contact */}
          <section className="patient-form-section">
            <div className="patient-section-heading">
              <div className="patient-section-icon emergency">
                <Phone size={20} />
              </div>

              <div>
                <h3>Emergency Contact</h3>
                <p>
                  Someone we can contact when needed
                </p>
              </div>
            </div>

            <div className="patient-form-grid">

              <div className="patient-field">
                <label htmlFor="emergencyName">
                  Contact Name
                </label>

                <div className="patient-input-wrapper">
                  <UserRound size={17} />

                  <input
                    id="emergencyName"
                    name="emergencyName"
                    type="text"
                    placeholder="Emergency contact name"
                    value={formData.emergencyName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="patient-field">
                <label htmlFor="emergencyPhone">
                  Contact Phone
                </label>

                <div className="patient-input-wrapper">
                  <Phone size={17} />

                  <input
                    id="emergencyPhone"
                    name="emergencyPhone"
                    type="tel"
                    placeholder="Emergency contact number"
                    value={formData.emergencyPhone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="patient-field">
                <label htmlFor="emergencyRelationship">
                  Relationship
                </label>

                <div className="patient-input-wrapper">
                  <HeartPulse size={17} />

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

            </div>
          </section>

          {/* Medical Information */}
          <section className="patient-form-section">
            <div className="patient-section-heading">
              <div className="patient-section-icon medical">
                <Stethoscope size={20} />
              </div>

              <div>
                <h3>Medical Information</h3>
                <p>
                  Help us understand your medical background
                </p>
              </div>
            </div>

            <div className="patient-medical-fields">

              <div className="patient-field">
                <label htmlFor="medicalHistory">
                  Medical History
                </label>

                <textarea
                  id="medicalHistory"
                  name="medicalHistory"
                  placeholder="Mention any important medical history, previous conditions or surgeries..."
                  value={formData.medicalHistory}
                  onChange={handleChange}
                  rows={5}
                />
              </div>

              <div className="patient-field">
                <label htmlFor="allergies">
                  Allergies
                </label>

                <div className="patient-input-wrapper">
                  <HeartPulse size={17} />

                  <input
                    id="allergies"
                    name="allergies"
                    type="text"
                    placeholder="e.g. Penicillin, dust, peanuts"
                    value={formData.allergies}
                    onChange={handleChange}
                  />
                </div>

                <span className="patient-field-hint">
                  Separate multiple allergies with commas.
                </span>
              </div>

            </div>
          </section>

          {/* Submit */}
          <button
            type="submit"
            className="patient-register-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="patient-spinner"></span>
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus size={19} />
                Create Patient Account
                <ChevronRight size={18} />
              </>
            )}
          </button>

        </form>

        {/* Navigation */}
        <div className="patient-register-navigation">

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="patient-nav-button"
          >
            <ArrowLeft size={16} />
            Back to Login
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/role-selection")
            }
            className="patient-nav-button"
          >
            Change Portal
          </button>

        </div>

        {/* Security */}
        <div className="patient-register-security">
          <div className="patient-security-icon">
            <ShieldCheck size={19} />
          </div>

          <div>
            <strong>Your information is secure</strong>
            <span>
              Your personal and medical information is
              securely handled by the CareSync clinic portal.
            </span>
          </div>
        </div>

        <p className="patient-register-footer">
          © {new Date().getFullYear()} CareSync
          <span>•</span>
          Secure Clinic Management
        </p>

      </main>
    </div>
  );
};

export default PatientRegister;