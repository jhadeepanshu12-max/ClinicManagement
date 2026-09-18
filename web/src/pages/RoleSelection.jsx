import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Stethoscope,
  Users,
  UserRound,
  ArrowRight,
} from "lucide-react";
import "./RoleSelection.css";

const roles = [
  {
    id: "patient",
    title: "Patient",
    description:
      "Create your account, book appointments and manage your health records, prescriptions and bills.",
    icon: UserRound,
    signup: true,
  },
  {
    id: "doctor",
    title: "Doctor",
    description:
      "Sign in to manage appointments, patients, medical records and prescriptions.",
    icon: Stethoscope,
    signup: false,
  },
  {
    id: "staff",
    title: "Staff",
    description:
      "Sign in to manage reception, appointments, billing and clinic operations.",
    icon: Users,
    signup: false,
  },
  {
    id: "admin",
    title: "Admin",
    description:
      "Sign in to manage your clinic, users, operations, reports and system settings.",
    icon: ShieldCheck,
    signup: false,
  },
];

const RoleSelection = () => {
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    sessionStorage.setItem("selected_login_role", role.id);

    if (role.id === "patient") {
      navigate("/patient-register");
      return;
    }

    navigate("/login");
  };

  return (
    <div className="role-page">
      <div className="role-background-glow role-glow-one"></div>
      <div className="role-background-glow role-glow-two"></div>

      <main className="role-container">
        {/* Brand */}

        <div className="role-brand">
          <div className="role-logo">
            <span>+</span>
          </div>

          <div>
            <h1>CareSync</h1>
            <p>Clinic Management</p>
          </div>
        </div>

        {/* Heading */}

        <div className="role-heading">
          <span className="role-eyebrow">
            SECURE CLINIC PORTAL
          </span>

          <h2>Welcome to CareSync</h2>

          <p>
            Choose how you would like to continue.
            Patients can create a new account, while
            clinic staff can sign in with their registered
            credentials.
          </p>
        </div>

        {/* Role Cards */}

        <div className="role-grid">
          {roles.map((role) => {
            const Icon = role.icon;

            return (
              <button
                key={role.id}
                type="button"
                className="role-card"
                onClick={() => handleRoleSelect(role)}
              >
                <div className="role-card-top">
                  <div className="role-icon">
                    <Icon size={25} strokeWidth={2} />
                  </div>

                  <div className="role-arrow">
                    <ArrowRight size={18} />
                  </div>
                </div>

                <div className="role-card-content">
                  <h3>{role.title}</h3>

                  <p>{role.description}</p>
                </div>

                <div className="role-card-action">
                  {role.signup
                    ? "Create Patient Account"
                    : `Sign in as ${role.title}`}
                </div>
              </button>
            );
          })}
        </div>

        {/* Security note */}

        <div className="role-security">
          <ShieldCheck size={17} />

          <span>
            Your access is verified securely against
            your registered account and permissions.
          </span>
        </div>

        <p className="role-footer">
          © {new Date().getFullYear()} CareSync
          <span> • </span>
          Secure Clinic Management
        </p>
      </main>
    </div>
  );
};

export default RoleSelection;