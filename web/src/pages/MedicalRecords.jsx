import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  CalendarDays,
  Check,
  Clock3,
  Eye,
  FileText,
  HeartPulse,
  Plus,
  Search,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import "./MedicalRecords.css";

const API_URL = import.meta.env.VITE_API_URL;

const initialForm = {
  patient: "",
  doctor: "",
  appointment: "",
  visitDate: "",
  chiefComplaint: "",
  symptoms: "",
  temperature: "",
  bloodPressure: "",
  heartRate: "",
  respiratoryRate: "",
  oxygenSaturation: "",
  weight: "",
  height: "",
  diagnosis: "",
  treatmentPlan: "",
  clinicalNotes: "",
  followUpDate: "",
  followUpNotes: "",
};

const MedicalRecords = () => {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState(null);

  const [form, setForm] = useState(initialForm);

  const getAuthConfig = () => {
    const token = localStorage.getItem("clinic_token");

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const normalizeList = (response, key) => {
    const data = response?.data?.data;

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.[key])) {
      return data[key];
    }

    if (Array.isArray(response?.data?.[key])) {
      return response.data[key];
    }

    return [];
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        recordsResponse,
        patientsResponse,
        doctorsResponse,
        appointmentsResponse,
      ] = await Promise.all([
        axios.get(
          `${API_URL}/medical-records`,
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
        axios.get(
          `${API_URL}/appointments`,
          getAuthConfig()
        ),
      ]);

      setRecords(
        normalizeList(recordsResponse, "medicalRecords")
      );

      setPatients(
        normalizeList(patientsResponse, "patients")
      );

      setDoctors(
        normalizeList(doctorsResponse, "doctors")
      );

      setAppointments(
        normalizeList(appointmentsResponse, "appointments")
      );
    } catch (err) {
      console.error("Fetch medical records error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("clinic_token");
        localStorage.removeItem("clinic_user");
        navigate("/login");
        return;
      }

      setRecords([]);
      setPatients([]);
      setDoctors([]);
      setAppointments([]);

      setError(
        err.response?.data?.message ||
          "Unable to load medical records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRecords = useMemo(() => {
    if (!Array.isArray(records)) {
      return [];
    }

    const search = searchTerm.toLowerCase().trim();

    if (!search) {
      return records;
    }

    return records.filter((record) => {
      const patientName =
        record?.patient?.name || "";

      const patientCode =
        record?.patient?.patientId || "";

      const doctorName =
        record?.doctor?.user?.name ||
        record?.doctor?.name ||
        "";

      const diagnosis =
        record?.diagnosis || "";

      const complaint =
        record?.chiefComplaint || "";

      return (
        patientName.toLowerCase().includes(search) ||
        patientCode.toLowerCase().includes(search) ||
        doctorName.toLowerCase().includes(search) ||
        diagnosis.toLowerCase().includes(search) ||
        complaint.toLowerCase().includes(search)
      );
    });
  }, [records, searchTerm]);

  const completedRecords = records.length;

  const uniquePatients = new Set(
    records
      .map((record) => record?.patient?._id)
      .filter(Boolean)
  ).size;

  const uniqueDoctors = new Set(
    records
      .map((record) => record?.doctor?._id)
      .filter(Boolean)
  ).size;

  const todayRecords = records.filter((record) => {
    if (!record?.visitDate) {
      return false;
    }

    const today = new Date();
    const visitDate = new Date(record.visitDate);

    return (
      today.toDateString() ===
      visitDate.toDateString()
    );
  }).length;

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

  const handlePatientChange = (event) => {
    const patientId = event.target.value;

    setForm((previous) => ({
      ...previous,
      patient: patientId,
      appointment: "",
    }));
  };

  const handleDoctorChange = (event) => {
    const doctorId = event.target.value;

    setForm((previous) => ({
      ...previous,
      doctor: doctorId,
      appointment: "",
    }));
  };

  const availableAppointments = useMemo(() => {
    if (!form.patient || !form.doctor) {
      return [];
    }

    return appointments.filter((appointment) => {
      const appointmentPatient =
        appointment?.patient?._id ||
        appointment?.patient;

      const appointmentDoctor =
        appointment?.doctor?._id ||
        appointment?.doctor;

      return (
        String(appointmentPatient) ===
          String(form.patient) &&
        String(appointmentDoctor) ===
          String(form.doctor)
      );
    });
  }, [
    appointments,
    form.patient,
    form.doctor,
  ]);

  const handleAppointmentChange = (event) => {
    const appointmentId = event.target.value;

    const appointment = appointments.find(
      (item) =>
        String(item._id) === String(appointmentId)
    );

    if (appointment) {
      setForm((previous) => ({
        ...previous,
        appointment: appointmentId,
        visitDate: appointment.appointmentDate
          ? new Date(
              appointment.appointmentDate
            )
              .toISOString()
              .split("T")[0]
          : previous.visitDate,
      }));
    } else {
      setForm((previous) => ({
        ...previous,
        appointment: appointmentId,
      }));
    }
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

    if (!form.appointment) {
      setError("Please select an appointment.");
      return;
    }

    if (!form.visitDate) {
      setError("Visit date is required.");
      return;
    }

    if (!form.chiefComplaint.trim()) {
      setError("Chief complaint is required.");
      return;
    }

    if (!form.diagnosis.trim()) {
      setError("Diagnosis is required.");
      return;
    }

    try {
      setSubmitting(true);

      const symptoms = form.symptoms
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const vitals = {};

      if (form.temperature !== "") {
        vitals.temperature = Number(
          form.temperature
        );
      }

      if (form.bloodPressure.trim()) {
        vitals.bloodPressure =
          form.bloodPressure.trim();
      }

      if (form.heartRate !== "") {
        vitals.heartRate = Number(
          form.heartRate
        );
      }

      if (form.respiratoryRate !== "") {
        vitals.respiratoryRate = Number(
          form.respiratoryRate
        );
      }

      if (form.oxygenSaturation !== "") {
        vitals.oxygenSaturation = Number(
          form.oxygenSaturation
        );
      }

      if (form.weight !== "") {
        vitals.weight = Number(form.weight);
      }

      if (form.height !== "") {
        vitals.height = Number(form.height);
      }

      const payload = {
        patient: form.patient,
        doctor: form.doctor,
        appointment: form.appointment,
        visitDate: form.visitDate,
        chiefComplaint:
          form.chiefComplaint.trim(),
        symptoms,
        vitals,
        diagnosis: form.diagnosis.trim(),
        treatmentPlan:
          form.treatmentPlan.trim(),
        clinicalNotes:
          form.clinicalNotes.trim(),
        followUpDate:
          form.followUpDate || undefined,
        followUpNotes:
          form.followUpNotes.trim(),
      };

      const response = await axios.post(
        `${API_URL}/medical-records`,
        payload,
        getAuthConfig()
      );

      setSuccess(
        response.data?.message ||
          "Medical record created successfully."
      );

      setShowAddModal(false);
      setForm({ ...initialForm });

      await fetchData();
    } catch (err) {
      console.error(
        "Create medical record error:",
        err
      );

      if (err.response?.status === 401) {
        localStorage.removeItem("clinic_token");
        localStorage.removeItem("clinic_user");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to create medical record."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openViewModal = (record) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setSelectedRecord(null);
    setShowViewModal(false);
  };

  const getPatientName = (record) =>
    record?.patient?.name || "Unknown Patient";

  const getPatientCode = (record) =>
    record?.patient?.patientId || "N/A";

  const getDoctorName = (record) =>
    record?.doctor?.user?.name ||
    record?.doctor?.name ||
    "Unknown Doctor";

  const getDoctorSpecialization = (record) =>
    record?.doctor?.specialization ||
    "General";

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  return (
    <div className="medical-page">
      <div className="medical-header">
        <div>
          <div className="medical-breadcrumb">
            <span>Clinic</span>
            <span>/</span>
            <span>Medical Records</span>
          </div>

          <h1>Medical Records</h1>

          <p>
            Manage electronic medical records and
            patient clinical history.
          </p>
        </div>

        <button
          className="medical-primary-button"
          onClick={openAddModal}
        >
          <Plus size={18} />
          New Medical Record
        </button>
      </div>

      {success && (
        <div className="medical-alert medical-success">
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
        <div className="medical-alert medical-error">
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

      <div className="medical-stats">
        <div className="medical-stat-card">
          <div className="medical-stat-icon">
            <FileText size={21} />
          </div>

          <div>
            <span>Total Records</span>
            <strong>{completedRecords}</strong>
          </div>
        </div>

        <div className="medical-stat-card">
          <div className="medical-stat-icon">
            <UserRound size={21} />
          </div>

          <div>
            <span>Patients</span>
            <strong>{uniquePatients}</strong>
          </div>
        </div>

        <div className="medical-stat-card">
          <div className="medical-stat-icon">
            <Stethoscope size={21} />
          </div>

          <div>
            <span>Doctors</span>
            <strong>{uniqueDoctors}</strong>
          </div>
        </div>

        <div className="medical-stat-card">
          <div className="medical-stat-icon">
            <CalendarDays size={21} />
          </div>

          <div>
            <span>Today's Records</span>
            <strong>{todayRecords}</strong>
          </div>
        </div>
      </div>

      <div className="medical-content-card">
        <div className="medical-content-header">
          <div>
            <h2>Medical Record Directory</h2>

            <p>
              {filteredRecords.length} record
              {filteredRecords.length !== 1
                ? "s"
                : ""}{" "}
              found
            </p>
          </div>

          <div className="medical-search">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search patient, doctor, diagnosis..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />
          </div>
        </div>

        {loading ? (
          <div className="medical-empty">
            <div className="medical-loading"></div>

            <h3>Loading medical records...</h3>

            <p>
              Please wait while we fetch clinical
              records.
            </p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="medical-empty">
            <div className="medical-empty-icon">
              <HeartPulse size={30} />
            </div>

            <h3>No medical records found</h3>

            <p>
              {searchTerm
                ? "Try changing your search term."
                : "Create the first medical record to get started."}
            </p>

            {!searchTerm && (
              <button
                className="medical-primary-button"
                onClick={openAddModal}
              >
                <Plus size={18} />
                New Medical Record
              </button>
            )}
          </div>
        ) : (
          <div className="medical-table-wrapper">
            <table className="medical-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Visit Date</th>
                  <th>Chief Complaint</th>
                  <th>Diagnosis</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record._id}>
                    <td>
                      <div className="medical-person">
                        <div className="medical-avatar">
                          <UserRound size={17} />
                        </div>

                        <div>
                          <strong>
                            {getPatientName(record)}
                          </strong>

                          <span>
                            {getPatientCode(record)}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="medical-doctor">
                        <strong>
                          {getDoctorName(record)}
                        </strong>

                        <span>
                          {getDoctorSpecialization(
                            record
                          )}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="medical-date">
                        <CalendarDays size={14} />

                        <span>
                          {formatDate(
                            record.visitDate
                          )}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="medical-complaint">
                        {record.chiefComplaint ||
                          "N/A"}
                      </span>
                    </td>

                    <td>
                      <span className="medical-diagnosis">
                        {record.diagnosis || "N/A"}
                      </span>
                    </td>

                    <td>
                      <span className="medical-status">
                        <Check size={13} />
                        Recorded
                      </span>
                    </td>

                    <td>
                      <button
                        className="medical-view-button"
                        onClick={() =>
                          openViewModal(record)
                        }
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div
          className="medical-modal-overlay"
          onMouseDown={closeAddModal}
        >
          <div
            className="medical-modal medical-add-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="medical-modal-header">
              <div>
                <h2>New Medical Record</h2>

                <p>
                  Record clinical information for a
                  patient consultation.
                </p>
              </div>

              <button
                className="medical-modal-close"
                type="button"
                onClick={closeAddModal}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="medical-alert medical-error medical-modal-alert">
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
              className="medical-form"
              onSubmit={handleSubmit}
            >
              <div className="medical-form-section">
                <div className="medical-form-title">
                  <UserRound size={18} />
                  Patient & Consultation
                </div>

                <div className="medical-form-grid">
                  <div className="medical-form-group">
                    <label>
                      Patient <span>*</span>
                    </label>

                    <select
                      name="patient"
                      value={form.patient}
                      onChange={handlePatientChange}
                      required
                    >
                      <option value="">
                        Select patient
                      </option>

                      {patients
                        .filter(
                          (patient) =>
                            patient.isActive !== false
                        )
                        .map((patient) => (
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

                  <div className="medical-form-group">
                    <label>
                      Doctor <span>*</span>
                    </label>

                    <select
                      name="doctor"
                      value={form.doctor}
                      onChange={handleDoctorChange}
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

                  <div className="medical-form-group">
                    <label>
                      Appointment <span>*</span>
                    </label>

                    <select
                      name="appointment"
                      value={form.appointment}
                      onChange={
                        handleAppointmentChange
                      }
                      required
                      disabled={
                        !form.patient ||
                        !form.doctor
                      }
                    >
                      <option value="">
                        {!form.patient ||
                        !form.doctor
                          ? "Select patient and doctor first"
                          : availableAppointments.length ===
                              0
                            ? "No matching appointments"
                            : "Select appointment"}
                      </option>

                      {availableAppointments.map(
                        (appointment) => (
                          <option
                            key={appointment._id}
                            value={appointment._id}
                          >
                            {formatDate(
                              appointment.appointmentDate
                            )}{" "}
                            —{" "}
                            {appointment.appointmentTime ||
                              "N/A"}{" "}
                            —{" "}
                            {appointment.reason ||
                              "Consultation"}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="medical-form-group">
                    <label>
                      Visit Date <span>*</span>
                    </label>

                    <input
                      type="date"
                      name="visitDate"
                      value={form.visitDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="medical-form-group full-width">
                    <label>
                      Chief Complaint <span>*</span>
                    </label>

                    <textarea
                      name="chiefComplaint"
                      value={form.chiefComplaint}
                      onChange={handleInputChange}
                      placeholder="Describe the patient's main complaint..."
                      rows="3"
                      required
                    />
                  </div>

                  <div className="medical-form-group full-width">
                    <label>
                      Symptoms
                      <small>
                        Separate multiple symptoms
                        with commas
                      </small>
                    </label>

                    <input
                      type="text"
                      name="symptoms"
                      value={form.symptoms}
                      onChange={handleInputChange}
                      placeholder="Fever, Headache, Weakness"
                    />
                  </div>
                </div>
              </div>

              <div className="medical-form-section">
                <div className="medical-form-title">
                  <HeartPulse size={18} />
                  Vitals
                </div>

                <div className="medical-vitals-grid">
                  <div className="medical-form-group">
                    <label>Temperature (°F)</label>

                    <input
                      type="number"
                      step="0.1"
                      name="temperature"
                      value={form.temperature}
                      onChange={handleInputChange}
                      placeholder="98.6"
                    />
                  </div>

                  <div className="medical-form-group">
                    <label>Blood Pressure</label>

                    <input
                      type="text"
                      name="bloodPressure"
                      value={form.bloodPressure}
                      onChange={handleInputChange}
                      placeholder="120/80"
                    />
                  </div>

                  <div className="medical-form-group">
                    <label>Heart Rate (bpm)</label>

                    <input
                      type="number"
                      name="heartRate"
                      value={form.heartRate}
                      onChange={handleInputChange}
                      placeholder="72"
                      min="0"
                    />
                  </div>

                  <div className="medical-form-group">
                    <label>
                      Respiratory Rate
                    </label>

                    <input
                      type="number"
                      name="respiratoryRate"
                      value={form.respiratoryRate}
                      onChange={handleInputChange}
                      placeholder="18"
                      min="0"
                    />
                  </div>

                  <div className="medical-form-group">
                    <label>
                      Oxygen Saturation (%)
                    </label>

                    <input
                      type="number"
                      name="oxygenSaturation"
                      value={
                        form.oxygenSaturation
                      }
                      onChange={handleInputChange}
                      placeholder="98"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div className="medical-form-group">
                    <label>Weight (kg)</label>

                    <input
                      type="number"
                      step="0.1"
                      name="weight"
                      value={form.weight}
                      onChange={handleInputChange}
                      placeholder="65"
                      min="0"
                    />
                  </div>

                  <div className="medical-form-group">
                    <label>Height (cm)</label>

                    <input
                      type="number"
                      step="0.1"
                      name="height"
                      value={form.height}
                      onChange={handleInputChange}
                      placeholder="165"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="medical-form-section">
                <div className="medical-form-title">
                  <Stethoscope size={18} />
                  Diagnosis & Treatment
                </div>

                <div className="medical-form-group">
                  <label>
                    Diagnosis <span>*</span>
                  </label>

                  <textarea
                    name="diagnosis"
                    value={form.diagnosis}
                    onChange={handleInputChange}
                    placeholder="Enter diagnosis..."
                    rows="3"
                    required
                  />
                </div>

                <div className="medical-form-group">
                  <label>Treatment Plan</label>

                  <textarea
                    name="treatmentPlan"
                    value={form.treatmentPlan}
                    onChange={handleInputChange}
                    placeholder="Rest, hydration, medication, etc."
                    rows="3"
                  />
                </div>

                <div className="medical-form-group">
                  <label>Clinical Notes</label>

                  <textarea
                    name="clinicalNotes"
                    value={form.clinicalNotes}
                    onChange={handleInputChange}
                    placeholder="Additional clinical observations..."
                    rows="4"
                  />
                </div>
              </div>

              <div className="medical-form-section">
                <div className="medical-form-title">
                  <CalendarDays size={18} />
                  Follow-up
                </div>

                <div className="medical-form-grid">
                  <div className="medical-form-group">
                    <label>Follow-up Date</label>

                    <input
                      type="date"
                      name="followUpDate"
                      value={form.followUpDate}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="medical-form-group">
                    <label>Follow-up Notes</label>

                    <input
                      type="text"
                      name="followUpNotes"
                      value={form.followUpNotes}
                      onChange={handleInputChange}
                      placeholder="Return after 3 days"
                    />
                  </div>
                </div>
              </div>

              <div className="medical-modal-footer">
                <button
                  type="button"
                  className="medical-secondary-button"
                  onClick={closeAddModal}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="medical-primary-button"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="medical-button-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Save Medical Record
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedRecord && (
        <div
          className="medical-modal-overlay"
          onMouseDown={closeViewModal}
        >
          <div
            className="medical-modal medical-view-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="medical-modal-header">
              <div>
                <h2>Medical Record</h2>

                <p>
                  Complete clinical information
                </p>
              </div>

              <button
                className="medical-modal-close"
                type="button"
                onClick={closeViewModal}
              >
                <X size={20} />
              </button>
            </div>

            <div className="medical-profile-header">
              <div className="medical-profile-icon">
                <HeartPulse size={29} />
              </div>

              <div>
                <h3>
                  {getPatientName(selectedRecord)}
                </h3>

                <p>
                  {getPatientCode(selectedRecord)}
                </p>

                <span className="medical-record-badge">
                  <Check size={12} />
                  Recorded
                </span>
              </div>
            </div>

            <div className="medical-detail-grid">
              <div>
                <span>
                  <Stethoscope size={14} />
                  Doctor
                </span>

                <strong>
                  {getDoctorName(selectedRecord)}
                </strong>
              </div>

              <div>
                <span>
                  <Activity size={14} />
                  Specialization
                </span>

                <strong>
                  {getDoctorSpecialization(
                    selectedRecord
                  )}
                </strong>
              </div>

              <div>
                <span>
                  <CalendarDays size={14} />
                  Visit Date
                </span>

                <strong>
                  {formatDate(
                    selectedRecord.visitDate
                  )}
                </strong>
              </div>

              <div>
                <span>
                  <FileText size={14} />
                  Appointment
                </span>

                <strong>
                  {selectedRecord.appointment?._id ||
                    selectedRecord.appointment ||
                    "N/A"}
                </strong>
              </div>
            </div>

            <div className="medical-detail-block">
              <span>
                <Activity size={14} />
                Chief Complaint
              </span>

              <p>
                {selectedRecord.chiefComplaint ||
                  "Not provided"}
              </p>
            </div>

            {Array.isArray(
              selectedRecord.symptoms
            ) &&
              selectedRecord.symptoms.length > 0 && (
                <div className="medical-detail-block">
                  <span>
                    <HeartPulse size={14} />
                    Symptoms
                  </span>

                  <div className="medical-tag-list">
                    {selectedRecord.symptoms.map(
                      (symptom, index) => (
                        <span key={index}>
                          {symptom}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

            {selectedRecord.vitals && (
              <div className="medical-vitals-view">
                <span className="medical-block-title">
                  <HeartPulse size={14} />
                  Vitals
                </span>

                <div className="medical-vitals-view-grid">
                  {selectedRecord.vitals
                    .temperature != null && (
                    <div>
                      <span>Temperature</span>
                      <strong>
                        {
                          selectedRecord.vitals
                            .temperature
                        }{" "}
                        °F
                      </strong>
                    </div>
                  )}

                  {selectedRecord.vitals
                    .bloodPressure && (
                    <div>
                      <span>Blood Pressure</span>
                      <strong>
                        {
                          selectedRecord.vitals
                            .bloodPressure
                        }
                      </strong>
                    </div>
                  )}

                  {selectedRecord.vitals
                    .heartRate != null && (
                    <div>
                      <span>Heart Rate</span>
                      <strong>
                        {
                          selectedRecord.vitals
                            .heartRate
                        }{" "}
                        bpm
                      </strong>
                    </div>
                  )}

                  {selectedRecord.vitals
                    .respiratoryRate != null && (
                    <div>
                      <span>Respiratory Rate</span>
                      <strong>
                        {
                          selectedRecord.vitals
                            .respiratoryRate
                        }{" "}
                        /min
                      </strong>
                    </div>
                  )}

                  {selectedRecord.vitals
                    .oxygenSaturation != null && (
                    <div>
                      <span>Oxygen Saturation</span>
                      <strong>
                        {
                          selectedRecord.vitals
                            .oxygenSaturation
                        }
                        %
                      </strong>
                    </div>
                  )}

                  {selectedRecord.vitals.weight !=
                    null && (
                    <div>
                      <span>Weight</span>
                      <strong>
                        {
                          selectedRecord.vitals
                            .weight
                        }{" "}
                        kg
                      </strong>
                    </div>
                  )}

                  {selectedRecord.vitals.height !=
                    null && (
                    <div>
                      <span>Height</span>
                      <strong>
                        {
                          selectedRecord.vitals
                            .height
                        }{" "}
                        cm
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="medical-detail-block">
              <span>
                <Stethoscope size={14} />
                Diagnosis
              </span>

              <p>
                {selectedRecord.diagnosis ||
                  "Not provided"}
              </p>
            </div>

            {selectedRecord.treatmentPlan && (
              <div className="medical-detail-block">
                <span>
                  <FileText size={14} />
                  Treatment Plan
                </span>

                <p>
                  {selectedRecord.treatmentPlan}
                </p>
              </div>
            )}

            {selectedRecord.clinicalNotes && (
              <div className="medical-detail-block">
                <span>
                  <FileText size={14} />
                  Clinical Notes
                </span>

                <p>
                  {selectedRecord.clinicalNotes}
                </p>
              </div>
            )}

            {selectedRecord.followUpDate && (
              <div className="medical-follow-up">
                <span>
                  <CalendarDays size={14} />
                  Follow-up
                </span>

                <strong>
                  {formatDate(
                    selectedRecord.followUpDate
                  )}
                </strong>

                {selectedRecord.followUpNotes && (
                  <p>
                    {selectedRecord.followUpNotes}
                  </p>
                )}
              </div>
            )}

            <div className="medical-modal-footer">
              <button
                className="medical-secondary-button"
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

export default MedicalRecords;