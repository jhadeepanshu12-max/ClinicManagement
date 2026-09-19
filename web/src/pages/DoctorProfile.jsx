import React, {
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import "./DoctorProfile.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const getUser = () => {
  try {
    const stored =
      localStorage.getItem(
        "clinic_user"
      );

    return stored
      ? JSON.parse(stored)
      : null;
  } catch {
    return null;
  }
};

const DoctorProfile = () => {
  const navigate = useNavigate();

  const user = getUser();

  const token =
    localStorage.getItem(
      "clinic_token"
    );

  const [profile, setProfile] =
    useState(null);

  const [form, setForm] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    if (!token || !user) {
      navigate(
        "/role-selection",
        {
          replace: true,
        }
      );

      return;
    }

    if (user.role !== "doctor") {
      navigate(
        "/doctor-dashboard",
        {
          replace: true,
        }
      );

      return;
    }

    const loadProfile =
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              `${API_URL}/doctor-profile/me`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

          const result =
            await response.json();

          if (!response.ok) {
            throw new Error(
              result.message ||
                "Unable to load profile"
            );
          }

          const doctor =
            result.data?.doctor;

          setProfile(doctor);

          setForm(
            createForm(doctor)
          );
        } catch (err) {
          console.error(
            "Profile loading error:",
            err
          );

          setError(
            err.message ||
              "Unable to load profile."
          );
        } finally {
          setLoading(false);
        }
      };

    loadProfile();
  }, [
    navigate,
    token,
    user?.role,
  ]);

  const createForm = (
    doctor
  ) => ({
    name:
      doctor?.user?.name || "",
    email:
      doctor?.user?.email || "",
    phone:
      doctor?.user?.phone || "",
    specialization:
      doctor?.specialization || "",
    qualification:
      doctor?.qualification || "",
    licenseNumber:
      doctor?.licenseNumber || "",
    experience:
      doctor?.experience ?? "",
    consultationFee:
      doctor?.consultationFee ?? "",
    department:
      doctor?.department || "",
    availableDays:
      doctor?.availableDays || [],
    startTime:
      doctor?.availability
        ?.startTime || "",
    endTime:
      doctor?.availability
        ?.endTime || "",
    bio:
      doctor?.bio || "",
  });

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  const toggleDay = (
    day
  ) => {
    setForm(
      (previous) => {
        const selected =
          previous.availableDays.includes(
            day
          );

        return {
          ...previous,
          availableDays:
            selected
              ? previous.availableDays.filter(
                  (item) =>
                    item !== day
                )
              : [
                  ...previous.availableDays,
                  day,
                ],
        };
      }
    );
  };

  const handleCancel =
    () => {
      setForm(
        createForm(profile)
      );

      setEditing(false);
      setError("");
      setSuccess("");
    };

  const handleSave = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response =
        await fetch(
          `${API_URL}/doctor-profile/me`,
          {
            method: "PUT",

            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name:
                form.name.trim(),

              email:
                form.email
                  .trim(),

              phone:
                form.phone
                  .trim(),

              specialization:
                form.specialization
                  .trim(),

              qualification:
                form.qualification
                  .trim(),

              licenseNumber:
                form.licenseNumber
                  .trim(),

              experience:
                Number(
                  form.experience
                ),

              consultationFee:
                Number(
                  form.consultationFee
                ),

              department:
                form.department
                  .trim(),

              availableDays:
                form.availableDays,

              availability: {
                startTime:
                  form.startTime,

                endTime:
                  form.endTime,
              },

              bio:
                form.bio.trim(),
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to update profile"
        );
      }

      const updatedDoctor =
        result.data?.doctor;

      setProfile(
        updatedDoctor
      );

      setForm(
        createForm(
          updatedDoctor
        )
      );

      const updatedUser = {
        ...user,

        name:
          updatedDoctor.user
            ?.name ||
          user.name,

        email:
          updatedDoctor.user
            ?.email ||
          user.email,

        phone:
          updatedDoctor.user
            ?.phone ||
          user.phone,
      };

      localStorage.setItem(
        "clinic_user",
        JSON.stringify(
          updatedUser
        )
      );

      setEditing(false);

      setSuccess(
        "Profile updated successfully."
      );
    } catch (err) {
      console.error(
        "Profile update error:",
        err
      );

      setError(
        err.message ||
          "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout =
    () => {
      localStorage.removeItem(
        "clinic_token"
      );

      localStorage.removeItem(
        "clinic_user"
      );

      localStorage.removeItem(
        "authenticated_role"
      );

      localStorage.removeItem(
        "selected_login_role"
      );

      navigate(
        "/role-selection",
        {
          replace: true,
        }
      );
    };

  if (loading) {
    return (
      <div className="doctor-profile-loading">
        <div>
          <div className="profile-loader">
            +
          </div>

          <h2>
            Loading profile...
          </h2>
        </div>
      </div>
    );
  }

  if (!profile || !form) {
    return (
      <div className="doctor-profile-loading">
        <div>
          <h2>
            Profile unavailable
          </h2>

          <p>
            {error ||
              "Doctor profile not found."}
          </p>

          <button
            onClick={() =>
              navigate(
                "/doctor-dashboard"
              )
            }
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const doctorName =
    profile.user?.name ||
    user?.name ||
    "Doctor";

  const initials =
    doctorName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (name) =>
          name
            .charAt(0)
            .toUpperCase()
      )
      .join("") || "DR";

  return (
    <div className="doctor-profile-page">
      <header className="doctor-profile-header">
        <div className="profile-header-left">
          <button
            className="profile-back-button"
            onClick={() =>
              navigate(
                "/doctor-dashboard"
              )
            }
          >
            ← Back to Dashboard
          </button>

          <div className="profile-page-title">
            <span>
              DOCTOR PORTAL
            </span>

            <strong>
              My Profile
            </strong>
          </div>
        </div>

        <button
          className="profile-logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      <main className="doctor-profile-container">
        <section className="doctor-profile-hero">
          <div className="profile-avatar">
            {initials}
          </div>

          <div className="profile-hero-details">
            <span>
              DOCTOR PROFILE
            </span>

            <h1>
              Dr. {doctorName}
            </h1>

            <p>
              {profile.specialization ||
                "Medical Specialist"}
            </p>

            <div className="profile-meta">
              <span>
                ✉{" "}
                {profile.user
                  ?.email ||
                  "No email"}
              </span>

              <span>
                ☎{" "}
                {profile.user
                  ?.phone ||
                  "No phone"}
              </span>

              <span>
                🏥{" "}
                {profile.department ||
                  "General Department"}
              </span>
            </div>
          </div>

          {!editing && (
            <button
              className="profile-edit-button"
              onClick={() => {
                setEditing(true);
                setError("");
                setSuccess("");
              }}
            >
              ✎ Edit Profile
            </button>
          )}
        </section>

        {error && (
          <div className="profile-message profile-error">
            ⚠ {error}
          </div>
        )}

        {success && (
          <div className="profile-message profile-success">
            ✓ {success}
          </div>
        )}

        {editing ? (
          <form
            onSubmit={handleSave}
            className="profile-form"
          >
            <section className="profile-card">
              <div className="profile-card-title">
                <div>
                  <h2>
                    Personal Information
                  </h2>

                  <p>
                    Manage your account
                    information.
                  </p>
                </div>

                <span>👤</span>
              </div>

              <div className="profile-grid">
                <label>
                  Full Name
                  <input
                    name="name"
                    value={form.name}
                    onChange={
                      handleChange
                    }
                    required
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={
                      handleChange
                    }
                    required
                  />
                </label>

                <label>
                  Phone
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={
                      handleChange
                    }
                  />
                </label>

                <label>
                  Department
                  <input
                    name="department"
                    value={
                      form.department
                    }
                    onChange={
                      handleChange
                    }
                  />
                </label>
              </div>
            </section>

            <section className="profile-card">
              <div className="profile-card-title">
                <div>
                  <h2>
                    Professional Information
                  </h2>

                  <p>
                    Manage your
                    professional details.
                  </p>
                </div>

                <span>🩺</span>
              </div>

              <div className="profile-grid">
                <label>
                  Specialization
                  <input
                    name="specialization"
                    value={
                      form.specialization
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </label>

                <label>
                  Qualification
                  <input
                    name="qualification"
                    value={
                      form.qualification
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </label>

                <label>
                  License Number
                  <input
                    name="licenseNumber"
                    value={
                      form.licenseNumber
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </label>

                <label>
                  Experience
                  <input
                    type="number"
                    min="0"
                    name="experience"
                    value={
                      form.experience
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </label>

                <label>
                  Consultation Fee
                  <input
                    type="number"
                    min="0"
                    name="consultationFee"
                    value={
                      form.consultationFee
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </label>
              </div>

              <label className="profile-full-field">
                Professional Bio

                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={
                    handleChange
                  }
                  rows="5"
                  placeholder="Write your professional bio..."
                />
              </label>
            </section>

            <section className="profile-card">
              <div className="profile-card-title">
                <div>
                  <h2>
                    Availability
                  </h2>

                  <p>
                    Select your working
                    days and hours.
                  </p>
                </div>

                <span>📅</span>
              </div>

              <div className="profile-days">
                {DAYS.map(
                  (day) => {
                    const selected =
                      form.availableDays.includes(
                        day
                      );

                    return (
                      <button
                        type="button"
                        key={day}
                        className={
                          selected
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          toggleDay(
                            day
                          )
                        }
                      >
                        {selected
                          ? "✓ "
                          : ""}
                        {day}
                      </button>
                    );
                  }
                )}
              </div>

              <div className="profile-grid profile-time-grid">
                <label>
                  Start Time
                  <input
                    type="time"
                    name="startTime"
                    value={
                      form.startTime
                    }
                    onChange={
                      handleChange
                    }
                  />
                </label>

                <label>
                  End Time
                  <input
                    type="time"
                    name="endTime"
                    value={
                      form.endTime
                    }
                    onChange={
                      handleChange
                    }
                  />
                </label>
              </div>
            </section>

            <div className="profile-actions">
              <button
                type="button"
                className="profile-cancel"
                onClick={
                  handleCancel
                }
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="profile-save"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-view">
            <section className="profile-card">
              <div className="profile-card-title">
                <div>
                  <h2>
                    Personal Information
                  </h2>

                  <p>
                    Your account
                    information.
                  </p>
                </div>

                <span>👤</span>
              </div>

              <div className="profile-info-grid">
                <div>
                  <span>
                    Full Name
                  </span>

                  <strong>
                    Dr. {doctorName}
                  </strong>
                </div>

                <div>
                  <span>
                    Email
                  </span>

                  <strong>
                    {profile.user
                      ?.email ||
                      "Not provided"}
                  </strong>
                </div>

                <div>
                  <span>
                    Phone
                  </span>

                  <strong>
                    {profile.user
                      ?.phone ||
                      "Not provided"}
                  </strong>
                </div>

                <div>
                  <span>
                    Department
                  </span>

                  <strong>
                    {profile.department ||
                      "Not specified"}
                  </strong>
                </div>
              </div>
            </section>

            <section className="profile-card">
              <div className="profile-card-title">
                <div>
                  <h2>
                    Professional Information
                  </h2>

                  <p>
                    Your clinical
                    credentials.
                  </p>
                </div>

                <span>🩺</span>
              </div>

              <div className="profile-info-grid">
                <div>
                  <span>
                    Specialization
                  </span>

                  <strong>
                    {profile.specialization ||
                      "Not specified"}
                  </strong>
                </div>

                <div>
                  <span>
                    Qualification
                  </span>

                  <strong>
                    {profile.qualification ||
                      "Not specified"}
                  </strong>
                </div>

                <div>
                  <span>
                    License Number
                  </span>

                  <strong>
                    {profile.licenseNumber ||
                      "Not specified"}
                  </strong>
                </div>

                <div>
                  <span>
                    Experience
                  </span>

                  <strong>
                    {profile.experience ??
                      0}{" "}
                    years
                  </strong>
                </div>

                <div>
                  <span>
                    Consultation Fee
                  </span>

                  <strong>
                    ₹
                    {Number(
                      profile.consultationFee ||
                        0
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </strong>
                </div>
              </div>

              <div className="profile-bio">
                <span>
                  Professional Bio
                </span>

                <p>
                  {profile.bio ||
                    "No professional bio added yet."}
                </p>
              </div>
            </section>

            <section className="profile-card">
              <div className="profile-card-title">
                <div>
                  <h2>
                    Availability
                  </h2>

                  <p>
                    Your consultation
                    schedule.
                  </p>
                </div>

                <span>📅</span>
              </div>

              <div className="profile-availability">
                <div>
                  <span>
                    Working Days
                  </span>

                  <div className="profile-day-list">
                    {profile
                      .availableDays
                      ?.length ? (
                      profile.availableDays.map(
                        (day) => (
                          <span
                            key={day}
                          >
                            {day}
                          </span>
                        )
                      )
                    ) : (
                      <strong>
                        Not configured
                      </strong>
                    )}
                  </div>
                </div>

                <div>
                  <span>
                    Consultation Hours
                  </span>

                  <strong>
                    {profile
                      .availability
                      ?.startTime &&
                    profile
                      .availability
                      ?.endTime
                      ? `${profile.availability.startTime} - ${profile.availability.endTime}`
                      : "Not configured"}
                  </strong>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default DoctorProfile;