import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  BriefcaseMedical,
  CalendarDays,
  Check,
  Clock3,
  Eye,
  FileText,
  Mail,
  Phone,
  Plus,
  Search,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import "./Doctors.css";

const API_URL = import.meta.env.VITE_API_URL;

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  specialization: "",
  qualification: "",
  licenseNumber: "",
  experience: "",
  consultationFee: "",
  availableDays: [],
  startTime: "",
  endTime: "",
  department: "",
  bio: "",
};

const days = [
  { label: "Mon", value: "monday" },
  { label: "Tue", value: "tuesday" },
  { label: "Wed", value: "wednesday" },
  { label: "Thu", value: "thursday" },
  { label: "Fri", value: "friday" },
  { label: "Sat", value: "saturday" },
  { label: "Sun", value: "sunday" },
];

const Doctors = () => {
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [form, setForm] = useState(initialForm);

  const getAuthConfig = () => {
    const token = localStorage.getItem("clinic_token");

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/doctors`,
        getAuthConfig()
      );

      const responseData = response.data?.data;

      let doctorList = [];

      if (Array.isArray(responseData)) {
        doctorList = responseData;
      } else if (Array.isArray(responseData?.doctors)) {
        doctorList = responseData.doctors;
      } else if (Array.isArray(response.data?.doctors)) {
        doctorList = response.data.doctors;
      }

      setDoctors(doctorList);
    } catch (err) {
      console.error("Fetch doctors error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("clinic_token");
        localStorage.removeItem("clinic_user");
        navigate("/login");
        return;
      }

      setDoctors([]);

      setError(
        err.response?.data?.message ||
          "Unable to load doctors. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const filteredDoctors = useMemo(() => {
    if (!Array.isArray(doctors)) {
      return [];
    }

    const search = searchTerm.toLowerCase().trim();

    if (!search) {
      return doctors;
    }

    return doctors.filter((doctor) => {
      const name = doctor?.user?.name || "";
      const email = doctor?.user?.email || "";
      const phone = doctor?.user?.phone || "";
      const specialization = doctor?.specialization || "";
      const qualification = doctor?.qualification || "";
      const license = doctor?.licenseNumber || "";
      const department = doctor?.department || "";

      return (
        name.toLowerCase().includes(search) ||
        email.toLowerCase().includes(search) ||
        phone.toLowerCase().includes(search) ||
        specialization.toLowerCase().includes(search) ||
        qualification.toLowerCase().includes(search) ||
        license.toLowerCase().includes(search) ||
        department.toLowerCase().includes(search)
      );
    });
  }, [doctors, searchTerm]);

  const activeDoctors = doctors.filter(
    (doctor) => doctor?.isActive !== false
  ).length;

  const specializations = new Set(
    doctors
      .map((doctor) => doctor?.specialization)
      .filter(Boolean)
  ).size;

  const averageFee =
    doctors.length > 0
      ? Math.round(
          doctors.reduce(
            (sum, doctor) =>
              sum + Number(doctor?.consultationFee || 0),
            0
          ) / doctors.length
        )
      : 0;

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleDayToggle = (day) => {
    setForm((previous) => {
      const isSelected =
        previous.availableDays.includes(day);

      return {
        ...previous,
        availableDays: isSelected
          ? previous.availableDays.filter(
              (selectedDay) => selectedDay !== day
            )
          : [...previous.availableDays, day],
      };
    });
  };

  const resetForm = () => {
    setForm({ ...initialForm });
    setError("");
  };

  const openAddModal = () => {
    resetForm();
    setSuccess("");
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    if (submitting) {
      return;
    }

    setShowAddModal(false);
    resetForm();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Doctor name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!form.password || form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!form.specialization.trim()) {
      setError("Specialization is required.");
      return;
    }

    if (!form.qualification.trim()) {
      setError("Qualification is required.");
      return;
    }

    if (!form.licenseNumber.trim()) {
      setError("License number is required.");
      return;
    }

    if (
      form.experience === "" ||
      Number(form.experience) < 0
    ) {
      setError("Please enter valid experience.");
      return;
    }

    if (
      form.consultationFee === "" ||
      Number(form.consultationFee) < 0
    ) {
      setError("Please enter a valid consultation fee.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        specialization: form.specialization.trim(),
        qualification: form.qualification.trim(),
        licenseNumber: form.licenseNumber.trim(),
        experience: Number(form.experience),
        consultationFee: Number(form.consultationFee),
        availableDays: form.availableDays,
        availability: {
          startTime: form.startTime,
          endTime: form.endTime,
        },
        department: form.department.trim(),
        bio: form.bio.trim(),
      };

      const response = await axios.post(
        `${API_URL}/doctors`,
        payload,
        getAuthConfig()
      );

      setSuccess(
        response.data?.message ||
          "Doctor added successfully."
      );

      setShowAddModal(false);
      setForm({ ...initialForm });

      await fetchDoctors();
    } catch (err) {
      console.error("Add doctor error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("clinic_token");
        localStorage.removeItem("clinic_user");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to add doctor. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openViewModal = (doctor) => {
    setSelectedDoctor(doctor);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setSelectedDoctor(null);
    setShowViewModal(false);
  };

  const getDoctorName = (doctor) =>
    doctor?.user?.name || "Unknown Doctor";

  const getDoctorEmail = (doctor) =>
    doctor?.user?.email || "No email";

  const getDoctorPhone = (doctor) =>
    doctor?.user?.phone || "No phone";

  const formatDays = (availableDays = []) => {
    if (!Array.isArray(availableDays) || !availableDays.length) {
      return "Not specified";
    }

    return availableDays
      .map((day) => {
        const found = days.find(
          (item) => item.value === day
        );

        return found ? found.label : day;
      })
      .join(", ");
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-breadcrumb">
            <span>Clinic</span>
            <span>/</span>
            <span>Doctors</span>
          </div>

          <h1>Doctors</h1>

          <p>
            Manage doctors, specializations, availability and
            consultation details.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={openAddModal}
        >
          <Plus size={18} />
          Add Doctor
        </button>
      </div>

      {success && (
        <div className="alert success-alert">
          <Check size={18} />
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && !showAddModal && (
        <div className="alert error-alert">
          <Activity size={18} />
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="stats-grid doctor-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <Stethoscope size={21} />
          </div>

          <div>
            <span className="stat-label">
              Total Doctors
            </span>
            <strong>{doctors.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Check size={21} />
          </div>

          <div>
            <span className="stat-label">
              Active Doctors
            </span>
            <strong>{activeDoctors}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <BriefcaseMedical size={21} />
          </div>

          <div>
            <span className="stat-label">
              Specializations
            </span>
            <strong>{specializations}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FileText size={21} />
          </div>

          <div>
            <span className="stat-label">
              Average Fee
            </span>
            <strong>₹{averageFee}</strong>
          </div>
        </div>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <div>
            <h2>Doctor Directory</h2>

            <p>
              {filteredDoctors.length} doctor
              {filteredDoctors.length !== 1 ? "s" : ""} found
            </p>
          </div>

          <div className="search-box">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search doctors..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner"></div>

            <h3>Loading doctors...</h3>

            <p>
              Please wait while we fetch doctor data.
            </p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Stethoscope size={30} />
            </div>

            <h3>No doctors found</h3>

            <p>
              {searchTerm
                ? "Try changing your search term."
                : "Add your first doctor to get started."}
            </p>

            {!searchTerm && (
              <button
                className="primary-button"
                onClick={openAddModal}
              >
                <Plus size={18} />
                Add Doctor
              </button>
            )}
          </div>
        ) : (
          <div className="doctor-grid">
            {filteredDoctors.map((doctor) => (
              <div
                className="doctor-card"
                key={doctor._id}
              >
                <div className="doctor-card-top">
                  <div className="doctor-avatar">
                    <UserRound size={25} />
                  </div>

                  <span
                    className={`status-badge ${
                      doctor.isActive === false
                        ? "inactive"
                        : "active"
                    }`}
                  >
                    {doctor.isActive === false
                      ? "Inactive"
                      : "Active"}
                  </span>
                </div>

                <div className="doctor-card-body">
                  <h3>{getDoctorName(doctor)}</h3>

                  <div className="doctor-specialization">
                    <Stethoscope size={16} />

                    <span>
                      {doctor.specialization ||
                        "Specialization not specified"}
                    </span>
                  </div>

                  <div className="doctor-info-row">
                    <Mail size={15} />
                    <span>{getDoctorEmail(doctor)}</span>
                  </div>

                  <div className="doctor-info-row">
                    <Phone size={15} />
                    <span>{getDoctorPhone(doctor)}</span>
                  </div>

                  <div className="doctor-meta">
                    <div>
                      <span>Experience</span>

                      <strong>
                        {doctor.experience || 0} years
                      </strong>
                    </div>

                    <div>
                      <span>Consultation</span>

                      <strong>
                        ₹{doctor.consultationFee || 0}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="doctor-card-footer">
                  <button
                    className="secondary-button"
                    onClick={() =>
                      openViewModal(doctor)
                    }
                  >
                    <Eye size={17} />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div
          className="modal-overlay"
          onMouseDown={closeAddModal}
        >
          <div
            className="modal large-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h2>Add New Doctor</h2>

                <p>
                  Enter the doctor's professional and
                  availability details.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeAddModal}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="alert error-alert modal-alert">
                <Activity size={18} />
                <span>{error}</span>

                <button
                  type="button"
                  onClick={() => setError("")}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <form
              className="doctor-form"
              onSubmit={handleSubmit}
            >
              <div className="form-section">
                <div className="form-section-title">
                  <UserRound size={18} />
                  <span>Basic Information</span>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      Full Name <span>*</span>
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleInputChange}
                      placeholder="Dr. John Doe"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Email <span>*</span>
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleInputChange}
                      placeholder="doctor@clinic.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone</label>

                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleInputChange}
                      placeholder="9876543210"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Password <span>*</span>
                    </label>

                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleInputChange}
                      placeholder="Minimum 6 characters"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">
                  <Stethoscope size={18} />
                  <span>Professional Information</span>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      Specialization <span>*</span>
                    </label>

                    <input
                      type="text"
                      name="specialization"
                      value={form.specialization}
                      onChange={handleInputChange}
                      placeholder="Cardiology"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Qualification <span>*</span>
                    </label>

                    <input
                      type="text"
                      name="qualification"
                      value={form.qualification}
                      onChange={handleInputChange}
                      placeholder="MBBS, MD"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Medical License Number <span>*</span>
                    </label>

                    <input
                      type="text"
                      name="licenseNumber"
                      value={form.licenseNumber}
                      onChange={handleInputChange}
                      placeholder="MED-2026-0003"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Experience (Years) <span>*</span>
                    </label>

                    <input
                      type="number"
                      name="experience"
                      value={form.experience}
                      onChange={handleInputChange}
                      placeholder="5"
                      min="0"
                      max="70"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Consultation Fee (₹) <span>*</span>
                    </label>

                    <input
                      type="number"
                      name="consultationFee"
                      value={form.consultationFee}
                      onChange={handleInputChange}
                      placeholder="500"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Department</label>

                    <input
                      type="text"
                      name="department"
                      value={form.department}
                      onChange={handleInputChange}
                      placeholder="General Medicine"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">
                  <CalendarDays size={18} />
                  <span>Availability</span>
                </div>

                <div className="form-group full-width">
                  <label>Available Days</label>

                  <div className="days-selector">
                    {days.map((day) => {
                      const selected =
                        form.availableDays.includes(
                          day.value
                        );

                      return (
                        <button
                          key={day.value}
                          type="button"
                          className={`day-button ${
                            selected ? "selected" : ""
                          }`}
                          onClick={() =>
                            handleDayToggle(day.value)
                          }
                        >
                          {selected && (
                            <Check size={14} />
                          )}

                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      <Clock3 size={15} />
                      Start Time
                    </label>

                    <input
                      type="time"
                      name="startTime"
                      value={form.startTime}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Clock3 size={15} />
                      End Time
                    </label>

                    <input
                      type="time"
                      name="endTime"
                      value={form.endTime}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">
                  <FileText size={18} />
                  <span>Doctor Profile</span>
                </div>

                <div className="form-group full-width">
                  <label>Bio</label>

                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleInputChange}
                    placeholder="Short professional description..."
                    rows="4"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeAddModal}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="button-spinner"></span>
                      Adding Doctor...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Add Doctor
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedDoctor && (
        <div
          className="modal-overlay"
          onMouseDown={closeViewModal}
        >
          <div
            className="modal doctor-view-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h2>Doctor Details</h2>

                <p>
                  Complete professional information
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeViewModal}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <div className="doctor-profile-header">
              <div className="doctor-profile-avatar">
                <Stethoscope size={32} />
              </div>

              <div>
                <h3>
                  {getDoctorName(selectedDoctor)}
                </h3>

                <p>
                  {selectedDoctor.specialization ||
                    "Specialization not specified"}
                </p>

                <span
                  className={`status-badge ${
                    selectedDoctor.isActive === false
                      ? "inactive"
                      : "active"
                  }`}
                >
                  {selectedDoctor.isActive === false
                    ? "Inactive"
                    : "Active"}
                </span>
              </div>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">
                  <Mail size={15} />
                  Email
                </span>

                <strong>
                  {getDoctorEmail(selectedDoctor)}
                </strong>
              </div>

              <div className="detail-item">
                <span className="detail-label">
                  <Phone size={15} />
                  Phone
                </span>

                <strong>
                  {getDoctorPhone(selectedDoctor)}
                </strong>
              </div>

              <div className="detail-item">
                <span className="detail-label">
                  <BriefcaseMedical size={15} />
                  Qualification
                </span>

                <strong>
                  {selectedDoctor.qualification ||
                    "Not specified"}
                </strong>
              </div>

              <div className="detail-item">
                <span className="detail-label">
                  <FileText size={15} />
                  License Number
                </span>

                <strong>
                  {selectedDoctor.licenseNumber ||
                    "Not specified"}
                </strong>
              </div>

              <div className="detail-item">
                <span className="detail-label">
                  <Activity size={15} />
                  Experience
                </span>

                <strong>
                  {selectedDoctor.experience || 0} years
                </strong>
              </div>

              <div className="detail-item">
                <span className="detail-label">
                  <FileText size={15} />
                  Consultation Fee
                </span>

                <strong>
                  ₹{selectedDoctor.consultationFee || 0}
                </strong>
              </div>

              <div className="detail-item">
                <span className="detail-label">
                  <BriefcaseMedical size={15} />
                  Department
                </span>

                <strong>
                  {selectedDoctor.department ||
                    "Not specified"}
                </strong>
              </div>

              <div className="detail-item">
                <span className="detail-label">
                  <CalendarDays size={15} />
                  Available Days
                </span>

                <strong>
                  {formatDays(
                    selectedDoctor.availableDays
                  )}
                </strong>
              </div>

              <div className="detail-item">
                <span className="detail-label">
                  <Clock3 size={15} />
                  Availability
                </span>

                <strong>
                  {selectedDoctor.availability?.startTime &&
                  selectedDoctor.availability?.endTime
                    ? `${selectedDoctor.availability.startTime} - ${selectedDoctor.availability.endTime}`
                    : "Not specified"}
                </strong>
              </div>
            </div>

            {selectedDoctor.bio && (
              <div className="doctor-bio">
                <span className="detail-label">
                  <FileText size={15} />
                  Professional Bio
                </span>

                <p>{selectedDoctor.bio}</p>
              </div>
            )}

            <div className="modal-footer">
              <button
                className="secondary-button"
                onClick={closeViewModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Doctors;