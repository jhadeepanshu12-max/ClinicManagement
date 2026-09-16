import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  CalendarDays,
  Check,
  Clock3,
  Eye,
  FileText,
  Plus,
  Search,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import "./Appointments.css";

const API_URL = import.meta.env.VITE_API_URL;

const initialForm = {
  patient: "",
  doctor: "",
  appointmentDate: "",
  appointmentTime: "",
  reason: "",
  status: "scheduled",
  notes: "",
};

const statusOptions = [
  { label: "All Status", value: "all" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "No-show", value: "no-show" },
];

const Appointments = () => {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedAppointment, setSelectedAppointment] =
    useState(null);

  const [form, setForm] = useState(initialForm);

  const getAuthConfig = () => {
    const token = localStorage.getItem("clinic_token");

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const normalizeList = (response) => {
    const data = response?.data?.data;

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.appointments)) {
      return data.appointments;
    }

    if (Array.isArray(response?.data?.appointments)) {
      return response.data.appointments;
    }

    if (Array.isArray(data?.patients)) {
      return data.patients;
    }

    if (Array.isArray(data?.doctors)) {
      return data.doctors;
    }

    return [];
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [appointmentsResponse, patientsResponse, doctorsResponse] =
        await Promise.all([
          axios.get(
            `${API_URL}/appointments`,
            getAuthConfig()
          ),
          axios.get(
            `${API_URL}/patients`,
            getAuthConfig()
          ),
          axios.get(
            `${API_URL}/doctors`,
            getAuthConfig()
          ),
        ]);

      setAppointments(normalizeList(appointmentsResponse));
      setPatients(normalizeList(patientsResponse));
      setDoctors(normalizeList(doctorsResponse));
    } catch (err) {
      console.error("Fetch appointments data error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("clinic_token");
        localStorage.removeItem("clinic_user");
        navigate("/login");
        return;
      }

      setAppointments([]);
      setPatients([]);
      setDoctors([]);

      setError(
        err.response?.data?.message ||
          "Unable to load appointment data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredAppointments = useMemo(() => {
    if (!Array.isArray(appointments)) {
      return [];
    }

    const search = searchTerm.toLowerCase().trim();

    return appointments.filter((appointment) => {
      const patientName =
        appointment?.patient?.name || "";

      const patientId =
        appointment?.patient?.patientId || "";

      const doctorName =
        appointment?.doctor?.user?.name ||
        appointment?.doctor?.name ||
        "";

      const specialization =
        appointment?.doctor?.specialization || "";

      const reason = appointment?.reason || "";

      const matchesSearch =
        !search ||
        patientName.toLowerCase().includes(search) ||
        patientId.toLowerCase().includes(search) ||
        doctorName.toLowerCase().includes(search) ||
        specialization.toLowerCase().includes(search) ||
        reason.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "all" ||
        appointment?.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

  const scheduledCount = appointments.filter(
    (appointment) =>
      appointment?.status === "scheduled" ||
      appointment?.status === "confirmed"
  ).length;

  const completedCount = appointments.filter(
    (appointment) => appointment?.status === "completed"
  ).length;

  const cancelledCount = appointments.filter(
    (appointment) => appointment?.status === "cancelled"
  ).length;

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
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

    if (!form.patient) {
      setError("Please select a patient.");
      return;
    }

    if (!form.doctor) {
      setError("Please select a doctor.");
      return;
    }

    if (!form.appointmentDate) {
      setError("Appointment date is required.");
      return;
    }

    if (!form.appointmentTime) {
      setError("Appointment time is required.");
      return;
    }

    if (!form.reason.trim()) {
      setError("Appointment reason is required.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        patient: form.patient,
        doctor: form.doctor,
        appointmentDate: form.appointmentDate,
        appointmentTime: form.appointmentTime,
        reason: form.reason.trim(),
        status: form.status,
        notes: form.notes.trim(),
      };

      const response = await axios.post(
        `${API_URL}/appointments`,
        payload,
        getAuthConfig()
      );

      setSuccess(
        response.data?.message ||
          "Appointment created successfully."
      );

      setShowAddModal(false);
      setForm({ ...initialForm });

      await fetchData();
    } catch (err) {
      console.error("Create appointment error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("clinic_token");
        localStorage.removeItem("clinic_user");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to create appointment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openViewModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setSelectedAppointment(null);
    setShowViewModal(false);
  };

  const getPatientName = (appointment) =>
    appointment?.patient?.name || "Unknown Patient";

  const getPatientCode = (appointment) =>
    appointment?.patient?.patientId || "N/A";

  const getDoctorName = (appointment) =>
    appointment?.doctor?.user?.name ||
    appointment?.doctor?.name ||
    "Unknown Doctor";

  const getDoctorSpecialization = (appointment) =>
    appointment?.doctor?.specialization ||
    "Specialization not specified";

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "scheduled":
        return "Scheduled";
      case "confirmed":
        return "Confirmed";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      case "no-show":
        return "No-show";
      default:
        return status || "Unknown";
    }
  };

  return (
    <div className="appointment-page">
      <div className="appointment-header">
        <div>
          <div className="appointment-breadcrumb">
            <span>Clinic</span>
            <span>/</span>
            <span>Appointments</span>
          </div>

          <h1>Appointments</h1>

          <p>
            Schedule and manage patient appointments.
          </p>
        </div>

        <button
          className="appointment-primary-button"
          onClick={openAddModal}
        >
          <Plus size={18} />
          New Appointment
        </button>
      </div>

      {success && (
        <div className="appointment-alert appointment-success">
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
        <div className="appointment-alert appointment-error">
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

      <div className="appointment-stats">
        <div className="appointment-stat-card">
          <div className="appointment-stat-icon">
            <CalendarDays size={21} />
          </div>

          <div>
            <span>Total Appointments</span>
            <strong>{appointments.length}</strong>
          </div>
        </div>

        <div className="appointment-stat-card">
          <div className="appointment-stat-icon">
            <Clock3 size={21} />
          </div>

          <div>
            <span>Upcoming</span>
            <strong>{scheduledCount}</strong>
          </div>
        </div>

        <div className="appointment-stat-card">
          <div className="appointment-stat-icon">
            <Check size={21} />
          </div>

          <div>
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </div>
        </div>

        <div className="appointment-stat-card">
          <div className="appointment-stat-icon">
            <Activity size={21} />
          </div>

          <div>
            <span>Cancelled</span>
            <strong>{cancelledCount}</strong>
          </div>
        </div>
      </div>

      <div className="appointment-content-card">
        <div className="appointment-content-header">
          <div>
            <h2>Appointment Directory</h2>

            <p>
              {filteredAppointments.length} appointment
              {filteredAppointments.length !== 1
                ? "s"
                : ""}{" "}
              found
            </p>
          </div>

          <div className="appointment-filters">
            <div className="appointment-search">
              <Search size={17} />

              <input
                type="text"
                placeholder="Search patient, doctor..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              {statusOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="appointment-empty">
            <div className="appointment-loading"></div>

            <h3>Loading appointments...</h3>

            <p>
              Please wait while we fetch appointment data.
            </p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="appointment-empty">
            <div className="appointment-empty-icon">
              <CalendarDays size={30} />
            </div>

            <h3>No appointments found</h3>

            <p>
              {searchTerm || statusFilter !== "all"
                ? "Try changing your search or filter."
                : "Create your first appointment to get started."}
            </p>

            {!searchTerm && statusFilter === "all" && (
              <button
                className="appointment-primary-button"
                onClick={openAddModal}
              >
                <Plus size={18} />
                New Appointment
              </button>
            )}
          </div>
        ) : (
          <div className="appointment-table-wrapper">
            <table className="appointment-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date & Time</th>
                  <th>Reason</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredAppointments.map(
                  (appointment) => (
                    <tr key={appointment._id}>
                      <td>
                        <div className="appointment-person">
                          <div className="appointment-avatar patient-avatar">
                            <UserRound size={18} />
                          </div>

                          <div>
                            <strong>
                              {getPatientName(
                                appointment
                              )}
                            </strong>

                            <span>
                              {getPatientCode(
                                appointment
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="appointment-doctor">
                          <strong>
                            {getDoctorName(
                              appointment
                            )}
                          </strong>

                          <span>
                            {getDoctorSpecialization(
                              appointment
                            )}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="appointment-date">
                          <strong>
                            {formatDate(
                              appointment.appointmentDate
                            )}
                          </strong>

                          <span>
                            <Clock3 size={13} />
                            {appointment.appointmentTime ||
                              "N/A"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="appointment-reason">
                          {appointment.reason || "N/A"}
                        </span>
                      </td>

                      <td>
                        <strong className="appointment-fee">
                          ₹
                          {Number(
                            appointment.consultationFee ||
                              0
                          )}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`appointment-status ${appointment.status || ""}`}
                        >
                          {getStatusLabel(
                            appointment.status
                          )}
                        </span>
                      </td>

                      <td>
                        <button
                          className="appointment-view-button"
                          onClick={() =>
                            openViewModal(appointment)
                          }
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div
          className="appointment-modal-overlay"
          onMouseDown={closeAddModal}
        >
          <div
            className="appointment-modal appointment-add-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="appointment-modal-header">
              <div>
                <h2>New Appointment</h2>

                <p>
                  Schedule a consultation for a patient.
                </p>
              </div>

              <button
                className="appointment-modal-close"
                type="button"
                onClick={closeAddModal}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="appointment-alert appointment-error appointment-modal-alert">
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
              className="appointment-form"
              onSubmit={handleSubmit}
            >
              <div className="appointment-form-section">
                <div className="appointment-form-title">
                  <UserRound size={18} />
                  Patient & Doctor
                </div>

                <div className="appointment-form-grid">
                  <div className="appointment-form-group">
                    <label>
                      Patient <span>*</span>
                    </label>

                    <select
                      name="patient"
                      value={form.patient}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">
                        Select patient
                      </option>

                      {patients.map((patient) => (
                        <option
                          key={patient._id}
                          value={patient._id}
                        >
                          {patient.name} —{" "}
                          {patient.patientId}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="appointment-form-group">
                    <label>
                      Doctor <span>*</span>
                    </label>

                    <select
                      name="doctor"
                      value={form.doctor}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">
                        Select doctor
                      </option>

                      {doctors
                        .filter(
                          (doctor) =>
                            doctor.isActive !== false
                        )
                        .map((doctor) => (
                          <option
                            key={doctor._id}
                            value={doctor._id}
                          >
                            {doctor.user?.name ||
                              "Unknown Doctor"}{" "}
                            —{" "}
                            {doctor.specialization ||
                              "General"}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="appointment-form-section">
                <div className="appointment-form-title">
                  <CalendarDays size={18} />
                  Appointment Schedule
                </div>

                <div className="appointment-form-grid">
                  <div className="appointment-form-group">
                    <label>
                      Appointment Date <span>*</span>
                    </label>

                    <input
                      type="date"
                      name="appointmentDate"
                      value={form.appointmentDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="appointment-form-group">
                    <label>
                      Appointment Time <span>*</span>
                    </label>

                    <input
                      type="time"
                      name="appointmentTime"
                      value={form.appointmentTime}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="appointment-form-group">
                    <label>Status</label>

                    <select
                      name="status"
                      value={form.status}
                      onChange={handleInputChange}
                    >
                      <option value="scheduled">
                        Scheduled
                      </option>

                      <option value="confirmed">
                        Confirmed
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="appointment-form-section">
                <div className="appointment-form-title">
                  <FileText size={18} />
                  Consultation Details
                </div>

                <div className="appointment-form-group">
                  <label>
                    Reason for Visit <span>*</span>
                  </label>

                  <textarea
                    name="reason"
                    value={form.reason}
                    onChange={handleInputChange}
                    placeholder="e.g. Fever, headache and weakness"
                    rows="3"
                    required
                  />
                </div>

                <div className="appointment-form-group">
                  <label>Notes</label>

                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleInputChange}
                    placeholder="Additional notes..."
                    rows="3"
                  />
                </div>
              </div>

              <div className="appointment-modal-footer">
                <button
                  type="button"
                  className="appointment-secondary-button"
                  onClick={closeAddModal}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="appointment-primary-button"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="appointment-button-spinner"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Create Appointment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedAppointment && (
        <div
          className="appointment-modal-overlay"
          onMouseDown={closeViewModal}
        >
          <div
            className="appointment-modal appointment-view-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="appointment-modal-header">
              <div>
                <h2>Appointment Details</h2>
                <p>
                  Complete appointment information
                </p>
              </div>

              <button
                className="appointment-modal-close"
                type="button"
                onClick={closeViewModal}
              >
                <X size={20} />
              </button>
            </div>

            <div className="appointment-view-header">
              <div className="appointment-view-icon">
                <CalendarDays size={28} />
              </div>

              <div>
                <h3>
                  {getPatientName(selectedAppointment)}
                </h3>

                <p>
                  {getPatientCode(selectedAppointment)}
                </p>

                <span
                  className={`appointment-status ${selectedAppointment.status || ""}`}
                >
                  {getStatusLabel(
                    selectedAppointment.status
                  )}
                </span>
              </div>
            </div>

            <div className="appointment-detail-grid">
              <div>
                <span>
                  <Stethoscope size={15} />
                  Doctor
                </span>

                <strong>
                  {getDoctorName(selectedAppointment)}
                </strong>
              </div>

              <div>
                <span>
                  <Activity size={15} />
                  Specialization
                </span>

                <strong>
                  {getDoctorSpecialization(
                    selectedAppointment
                  )}
                </strong>
              </div>

              <div>
                <span>
                  <CalendarDays size={15} />
                  Date
                </span>

                <strong>
                  {formatDate(
                    selectedAppointment.appointmentDate
                  )}
                </strong>
              </div>

              <div>
                <span>
                  <Clock3 size={15} />
                  Time
                </span>

                <strong>
                  {selectedAppointment.appointmentTime ||
                    "N/A"}
                </strong>
              </div>

              <div>
                <span>
                  <FileText size={15} />
                  Consultation Fee
                </span>

                <strong>
                  ₹
                  {Number(
                    selectedAppointment.consultationFee ||
                      0
                  )}
                </strong>
              </div>

              <div>
                <span>
                  <Activity size={15} />
                  Appointment ID
                </span>

                <strong>
                  {selectedAppointment._id}
                </strong>
              </div>
            </div>

            <div className="appointment-detail-block">
              <span>
                <FileText size={15} />
                Reason for Visit
              </span>

              <p>
                {selectedAppointment.reason ||
                  "No reason provided."}
              </p>
            </div>

            {selectedAppointment.notes && (
              <div className="appointment-detail-block">
                <span>
                  <FileText size={15} />
                  Notes
                </span>

                <p>{selectedAppointment.notes}</p>
              </div>
            )}

            <div className="appointment-modal-footer">
              <button
                className="appointment-secondary-button"
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

export default Appointments;