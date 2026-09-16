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
  Pill,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import "./Prescription.css";

const API_URL = import.meta.env.VITE_API_URL;

const emptyMedicine = {
  name: "",
  dosage: "",
  frequency: "",
  duration: "",
  route: "Oral",
  instructions: "",
};

const initialForm = {
  patient: "",
  doctor: "",
  appointment: "",
  medicalRecord: "",
  prescriptionDate: "",
  generalInstructions: "",
  advice: "",
  followUpDate: "",
};

const Prescription = () => {
  const navigate = useNavigate();

  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedPrescription, setSelectedPrescription] =
    useState(null);

  const [form, setForm] = useState(initialForm);
  const [medicines, setMedicines] = useState([
    { ...emptyMedicine },
  ]);

  const getAuthConfig = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem(
        "clinic_token"
      )}`,
    },
  });

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
        prescriptionsResponse,
        patientsResponse,
        doctorsResponse,
        appointmentsResponse,
        recordsResponse,
      ] = await Promise.all([
        axios.get(
          `${API_URL}/prescriptions`,
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
        axios.get(
          `${API_URL}/medical-records`,
          getAuthConfig()
        ),
      ]);

      setPrescriptions(
        normalizeList(
          prescriptionsResponse,
          "prescriptions"
        )
      );

      setPatients(
        normalizeList(patientsResponse, "patients")
      );

      setDoctors(
        normalizeList(doctorsResponse, "doctors")
      );

      setAppointments(
        normalizeList(
          appointmentsResponse,
          "appointments"
        )
      );

      setMedicalRecords(
        normalizeList(
          recordsResponse,
          "medicalRecords"
        )
      );
    } catch (err) {
      console.error(
        "Fetch prescriptions error:",
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
          "Unable to load prescriptions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPrescriptions = useMemo(() => {
    if (!Array.isArray(prescriptions)) {
      return [];
    }

    const search = searchTerm
      .toLowerCase()
      .trim();

    if (!search) {
      return prescriptions;
    }

    return prescriptions.filter(
      (prescription) => {
        const patient =
          prescription?.patient?.name || "";

        const patientCode =
          prescription?.patient?.patientId || "";

        const doctor =
          prescription?.doctor?.user?.name ||
          prescription?.doctor?.name ||
          "";

        const diagnosis =
          prescription?.medicalRecord?.diagnosis ||
          "";

        const medicinesText = Array.isArray(
          prescription?.medicines
        )
          ? prescription.medicines
              .map((medicine) => medicine.name)
              .join(" ")
          : "";

        return (
          patient
            .toLowerCase()
            .includes(search) ||
          patientCode
            .toLowerCase()
            .includes(search) ||
          doctor
            .toLowerCase()
            .includes(search) ||
          diagnosis
            .toLowerCase()
            .includes(search) ||
          medicinesText
            .toLowerCase()
            .includes(search)
        );
      }
    );
  }, [prescriptions, searchTerm]);

  const totalMedicines = prescriptions.reduce(
    (total, prescription) =>
      total +
      (Array.isArray(prescription.medicines)
        ? prescription.medicines.length
        : 0),
    0
  );

  const uniquePatients = new Set(
    prescriptions
      .map(
        (prescription) =>
          prescription?.patient?._id
      )
      .filter(Boolean)
  ).size;

  const uniqueDoctors = new Set(
    prescriptions
      .map(
        (prescription) =>
          prescription?.doctor?._id
      )
      .filter(Boolean)
  ).size;

  const activePrescriptions =
    prescriptions.filter(
      (prescription) =>
        prescription?.isActive !== false
    ).length;

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePatientChange = (event) => {
    setForm((previous) => ({
      ...previous,
      patient: event.target.value,
      appointment: "",
      medicalRecord: "",
    }));
  };

  const handleDoctorChange = (event) => {
    setForm((previous) => ({
      ...previous,
      doctor: event.target.value,
      appointment: "",
      medicalRecord: "",
    }));
  };

  const availableAppointments = useMemo(() => {
    if (!form.patient || !form.doctor) {
      return [];
    }

    return appointments.filter(
      (appointment) => {
        const patientId =
          appointment?.patient?._id ||
          appointment?.patient;

        const doctorId =
          appointment?.doctor?._id ||
          appointment?.doctor;

        return (
          String(patientId) ===
            String(form.patient) &&
          String(doctorId) ===
            String(form.doctor)
        );
      }
    );
  }, [
    appointments,
    form.patient,
    form.doctor,
  ]);

  const availableRecords = useMemo(() => {
    if (!form.patient || !form.doctor) {
      return [];
    }

    return medicalRecords.filter((record) => {
      const patientId =
        record?.patient?._id ||
        record?.patient;

      const doctorId =
        record?.doctor?._id ||
        record?.doctor;

      return (
        String(patientId) ===
          String(form.patient) &&
        String(doctorId) ===
          String(form.doctor)
      );
    });
  }, [
    medicalRecords,
    form.patient,
    form.doctor,
  ]);

  const handleAppointmentChange = (event) => {
    const appointmentId = event.target.value;

    setForm((previous) => ({
      ...previous,
      appointment: appointmentId,
    }));

    const matchingRecord =
      medicalRecords.find((record) => {
        const recordAppointment =
          record?.appointment?._id ||
          record?.appointment;

        return (
          String(recordAppointment) ===
          String(appointmentId)
        );
      });

    if (matchingRecord) {
      setForm((previous) => ({
        ...previous,
        appointment: appointmentId,
        medicalRecord:
          matchingRecord._id,
      }));
    }
  };

  const handleRecordChange = (event) => {
    setForm((previous) => ({
      ...previous,
      medicalRecord: event.target.value,
    }));
  };

  const handleMedicineChange = (
    index,
    event
  ) => {
    const { name, value } = event.target;

    setMedicines((previous) =>
      previous.map((medicine, medicineIndex) =>
        medicineIndex === index
          ? {
              ...medicine,
              [name]: value,
            }
          : medicine
      )
    );
  };

  const addMedicine = () => {
    setMedicines((previous) => [
      ...previous,
      { ...emptyMedicine },
    ]);
  };

  const removeMedicine = (index) => {
    if (medicines.length === 1) {
      return;
    }

    setMedicines((previous) =>
      previous.filter(
        (_, medicineIndex) =>
          medicineIndex !== index
      )
    );
  };

  const resetForm = () => {
    setForm({
      ...initialForm,
      prescriptionDate: new Date()
        .toISOString()
        .split("T")[0],
    });

    setMedicines([{ ...emptyMedicine }]);
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

    if (!form.appointment) {
      setError("Please select an appointment.");
      return;
    }

    if (!form.medicalRecord) {
      setError(
        "Please select a medical record."
      );
      return;
    }

    const invalidMedicine =
      medicines.some(
        (medicine) =>
          !medicine.name.trim() ||
          !medicine.dosage.trim() ||
          !medicine.frequency.trim() ||
          !medicine.duration.trim()
      );

    if (invalidMedicine) {
      setError(
        "Please complete all required medicine fields."
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        patient: form.patient,
        doctor: form.doctor,
        appointment: form.appointment,
        medicalRecord: form.medicalRecord,
        prescriptionDate:
          form.prescriptionDate ||
          undefined,
        medicines: medicines.map(
          (medicine) => ({
            name: medicine.name.trim(),
            dosage: medicine.dosage.trim(),
            frequency:
              medicine.frequency.trim(),
            duration:
              medicine.duration.trim(),
            route: medicine.route.trim() || "Oral",
            instructions:
              medicine.instructions.trim(),
          })
        ),
        generalInstructions:
          form.generalInstructions.trim(),
        advice: form.advice.trim(),
        followUpDate:
          form.followUpDate || undefined,
      };

      const response = await axios.post(
        `${API_URL}/prescriptions`,
        payload,
        getAuthConfig()
      );

      setSuccess(
        response.data?.message ||
          "Prescription created successfully."
      );

      setShowAddModal(false);
      resetForm();

      await fetchData();
    } catch (err) {
      console.error(
        "Create prescription error:",
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
          "Unable to create prescription."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openViewModal = (prescription) => {
    setSelectedPrescription(prescription);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setSelectedPrescription(null);
    setShowViewModal(false);
  };

  const getPatientName = (prescription) =>
    prescription?.patient?.name ||
    "Unknown Patient";

  const getPatientCode = (prescription) =>
    prescription?.patient?.patientId ||
    "N/A";

  const getDoctorName = (prescription) =>
    prescription?.doctor?.user?.name ||
    prescription?.doctor?.name ||
    "Unknown Doctor";

  const getSpecialization = (prescription) =>
    prescription?.doctor?.specialization ||
    "General";

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  return (
    <div className="prescription-page">
      <div className="prescription-header">
        <div>
          <div className="prescription-breadcrumb">
            <span>Clinic</span>
            <span>/</span>
            <span>Prescriptions</span>
          </div>

          <h1>Prescriptions</h1>

          <p>
            Create and manage digital patient
            prescriptions.
          </p>
        </div>

        <button
          className="prescription-primary-button"
          onClick={openAddModal}
        >
          <Plus size={18} />
          New Prescription
        </button>
      </div>

      {success && (
        <div className="prescription-alert prescription-success">
          <Check size={18} />
          <span>{success}</span>

          <button
            onClick={() => setSuccess("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && !showAddModal && (
        <div className="prescription-alert prescription-error">
          <Activity size={18} />
          <span>{error}</span>

          <button
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="prescription-stats">
        <div className="prescription-stat-card">
          <div className="prescription-stat-icon">
            <FileText size={21} />
          </div>

          <div>
            <span>Total Prescriptions</span>
            <strong>
              {prescriptions.length}
            </strong>
          </div>
        </div>

        <div className="prescription-stat-card">
          <div className="prescription-stat-icon">
            <Check size={21} />
          </div>

          <div>
            <span>Active</span>
            <strong>
              {activePrescriptions}
            </strong>
          </div>
        </div>

        <div className="prescription-stat-card">
          <div className="prescription-stat-icon">
            <UserRound size={21} />
          </div>

          <div>
            <span>Patients</span>
            <strong>{uniquePatients}</strong>
          </div>
        </div>

        <div className="prescription-stat-card">
          <div className="prescription-stat-icon">
            <Pill size={21} />
          </div>

          <div>
            <span>Medicines</span>
            <strong>{totalMedicines}</strong>
          </div>
        </div>
      </div>

      <div className="prescription-content-card">
        <div className="prescription-content-header">
          <div>
            <h2>Prescription Directory</h2>

            <p>
              {filteredPrescriptions.length}{" "}
              prescription
              {filteredPrescriptions.length !==
              1
                ? "s"
                : ""}{" "}
              found
            </p>
          </div>

          <div className="prescription-search">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search patient, doctor, medicine..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />
          </div>
        </div>

        {loading ? (
          <div className="prescription-empty">
            <div className="prescription-loading"></div>

            <h3>
              Loading prescriptions...
            </h3>

            <p>
              Please wait while we fetch
              prescriptions.
            </p>
          </div>
        ) : filteredPrescriptions.length ===
          0 ? (
          <div className="prescription-empty">
            <div className="prescription-empty-icon">
              <Pill size={30} />
            </div>

            <h3>
              No prescriptions found
            </h3>

            <p>
              {searchTerm
                ? "Try changing your search term."
                : "Create the first prescription to get started."}
            </p>

            {!searchTerm && (
              <button
                className="prescription-primary-button"
                onClick={openAddModal}
              >
                <Plus size={18} />
                New Prescription
              </button>
            )}
          </div>
        ) : (
          <div className="prescription-table-wrapper">
            <table className="prescription-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Medicines</th>
                  <th>Diagnosis</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredPrescriptions.map(
                  (prescription) => (
                    <tr
                      key={prescription._id}
                    >
                      <td>
                        <div className="prescription-person">
                          <div className="prescription-avatar">
                            <UserRound
                              size={17}
                            />
                          </div>

                          <div>
                            <strong>
                              {getPatientName(
                                prescription
                              )}
                            </strong>

                            <span>
                              {getPatientCode(
                                prescription
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="prescription-doctor">
                          <strong>
                            {getDoctorName(
                              prescription
                            )}
                          </strong>

                          <span>
                            {getSpecialization(
                              prescription
                            )}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="prescription-date">
                          <CalendarDays
                            size={14}
                          />

                          {formatDate(
                            prescription.prescriptionDate
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="medicine-count">
                          <Pill size={14} />

                          {Array.isArray(
                            prescription.medicines
                          )
                            ? prescription
                                .medicines
                                .length
                            : 0}{" "}
                          medicine
                          {prescription
                            .medicines
                            ?.length !== 1
                            ? "s"
                            : ""}
                        </div>
                      </td>

                      <td>
                        <span className="prescription-diagnosis">
                          {prescription
                            .medicalRecord
                            ?.diagnosis ||
                            "N/A"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            prescription.isActive ===
                            false
                              ? "prescription-status inactive"
                              : "prescription-status"
                          }
                        >
                          <Check size={13} />

                          {prescription.isActive ===
                          false
                            ? "Inactive"
                            : "Active"}
                        </span>
                      </td>

                      <td>
                        <button
                          className="prescription-view-button"
                          onClick={() =>
                            openViewModal(
                              prescription
                            )
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
          className="prescription-modal-overlay"
          onMouseDown={closeAddModal}
        >
          <div
            className="prescription-modal prescription-add-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="prescription-modal-header">
              <div>
                <h2>
                  New Prescription
                </h2>

                <p>
                  Create a digital prescription
                  for a completed consultation.
                </p>
              </div>

              <button
                className="prescription-modal-close"
                type="button"
                onClick={closeAddModal}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="prescription-alert prescription-error prescription-modal-alert">
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
              className="prescription-form"
              onSubmit={handleSubmit}
            >
              <div className="prescription-form-section">
                <div className="prescription-form-title">
                  <UserRound size={18} />
                  Consultation
                </div>

                <div className="prescription-form-grid">
                  <div className="prescription-form-group">
                    <label>
                      Patient <span>*</span>
                    </label>

                    <select
                      value={form.patient}
                      onChange={
                        handlePatientChange
                      }
                      required
                    >
                      <option value="">
                        Select patient
                      </option>

                      {patients
                        .filter(
                          (patient) =>
                            patient.isActive !==
                            false
                        )
                        .map((patient) => (
                          <option
                            key={patient._id}
                            value={patient._id}
                          >
                            {patient.name} —{" "}
                            {
                              patient.patientId
                            }
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="prescription-form-group">
                    <label>
                      Doctor <span>*</span>
                    </label>

                    <select
                      value={form.doctor}
                      onChange={
                        handleDoctorChange
                      }
                      required
                    >
                      <option value="">
                        Select doctor
                      </option>

                      {doctors
                        .filter(
                          (doctor) =>
                            doctor.isActive !==
                            false
                        )
                        .map((doctor) => (
                          <option
                            key={doctor._id}
                            value={doctor._id}
                          >
                            {doctor.user?.name ||
                              "Unknown Doctor"}{" "}
                            —{" "}
                            {
                              doctor.specialization
                            }
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="prescription-form-group">
                    <label>
                      Appointment <span>*</span>
                    </label>

                    <select
                      value={form.appointment}
                      onChange={
                        handleAppointmentChange
                      }
                      disabled={
                        !form.patient ||
                        !form.doctor
                      }
                      required
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
                            {
                              appointment.appointmentTime
                            }{" "}
                            —{" "}
                            {appointment.reason}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="prescription-form-group">
                    <label>
                      Medical Record <span>*</span>
                    </label>

                    <select
                      value={form.medicalRecord}
                      onChange={
                        handleRecordChange
                      }
                      disabled={
                        !form.patient ||
                        !form.doctor
                      }
                      required
                    >
                      <option value="">
                        {!form.patient ||
                        !form.doctor
                          ? "Select patient and doctor first"
                          : availableRecords.length ===
                              0
                            ? "No medical records found"
                            : "Select medical record"}
                      </option>

                      {availableRecords.map(
                        (record) => (
                          <option
                            key={record._id}
                            value={record._id}
                          >
                            {formatDate(
                              record.visitDate
                            )}{" "}
                            —{" "}
                            {record.diagnosis}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="prescription-form-group">
                    <label>
                      Prescription Date
                    </label>

                    <input
                      type="date"
                      name="prescriptionDate"
                      value={
                        form.prescriptionDate
                      }
                      onChange={
                        handleInputChange
                      }
                    />
                  </div>

                  <div className="prescription-form-group">
                    <label>
                      Follow-up Date
                    </label>

                    <input
                      type="date"
                      name="followUpDate"
                      value={
                        form.followUpDate
                      }
                      onChange={
                        handleInputChange
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="prescription-form-section">
                <div className="prescription-form-title prescription-medicine-title">
                  <Pill size={18} />
                  Medicines

                  <button
                    type="button"
                    className="prescription-add-medicine"
                    onClick={addMedicine}
                  >
                    <Plus size={15} />
                    Add Medicine
                  </button>
                </div>

                <div className="medicine-list">
                  {medicines.map(
                    (medicine, index) => (
                      <div
                        className="medicine-card"
                        key={index}
                      >
                        <div className="medicine-card-header">
                          <strong>
                            Medicine {index + 1}
                          </strong>

                          {medicines.length >
                            1 && (
                            <button
                              type="button"
                              className="medicine-remove"
                              onClick={() =>
                                removeMedicine(
                                  index
                                )
                              }
                            >
                              <Trash2
                                size={15}
                              />
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="medicine-grid">
                          <div className="prescription-form-group">
                            <label>
                              Medicine Name{" "}
                              <span>*</span>
                            </label>

                            <input
                              name="name"
                              value={
                                medicine.name
                              }
                              onChange={(event) =>
                                handleMedicineChange(
                                  index,
                                  event
                                )
                              }
                              placeholder="Paracetamol"
                              required
                            />
                          </div>

                          <div className="prescription-form-group">
                            <label>
                              Dosage <span>*</span>
                            </label>

                            <input
                              name="dosage"
                              value={
                                medicine.dosage
                              }
                              onChange={(event) =>
                                handleMedicineChange(
                                  index,
                                  event
                                )
                              }
                              placeholder="500 mg"
                              required
                            />
                          </div>

                          <div className="prescription-form-group">
                            <label>
                              Frequency <span>*</span>
                            </label>

                            <input
                              name="frequency"
                              value={
                                medicine.frequency
                              }
                              onChange={(event) =>
                                handleMedicineChange(
                                  index,
                                  event
                                )
                              }
                              placeholder="Twice daily"
                              required
                            />
                          </div>

                          <div className="prescription-form-group">
                            <label>
                              Duration <span>*</span>
                            </label>

                            <input
                              name="duration"
                              value={
                                medicine.duration
                              }
                              onChange={(event) =>
                                handleMedicineChange(
                                  index,
                                  event
                                )
                              }
                              placeholder="3 days"
                              required
                            />
                          </div>

                          <div className="prescription-form-group">
                            <label>
                              Route
                            </label>

                            <select
                              name="route"
                              value={
                                medicine.route
                              }
                              onChange={(event) =>
                                handleMedicineChange(
                                  index,
                                  event
                                )
                              }
                            >
                              <option>
                                Oral
                              </option>
                              <option>
                                Topical
                              </option>
                              <option>
                                Intravenous
                              </option>
                              <option>
                                Intramuscular
                              </option>
                              <option>
                                Subcutaneous
                              </option>
                              <option>
                                Inhalation
                              </option>
                              <option>
                                Other
                              </option>
                            </select>
                          </div>

                          <div className="prescription-form-group">
                            <label>
                              Instructions
                            </label>

                            <input
                              name="instructions"
                              value={
                                medicine.instructions
                              }
                              onChange={(event) =>
                                handleMedicineChange(
                                  index,
                                  event
                                )
                              }
                              placeholder="Take after food"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="prescription-form-section">
                <div className="prescription-form-title">
                  <FileText size={18} />
                  Instructions & Advice
                </div>

                <div className="prescription-form-group">
                  <label>
                    General Instructions
                  </label>

                  <textarea
                    name="generalInstructions"
                    value={
                      form.generalInstructions
                    }
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Rest, stay hydrated, complete the course..."
                  />
                </div>

                <div className="prescription-form-group">
                  <label>Advice</label>

                  <textarea
                    name="advice"
                    value={form.advice}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Monitor symptoms and return if condition worsens..."
                  />
                </div>
              </div>

              <div className="prescription-modal-footer">
                <button
                  type="button"
                  className="prescription-secondary-button"
                  onClick={closeAddModal}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="prescription-primary-button"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="prescription-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Save Prescription
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal &&
        selectedPrescription && (
          <div
            className="prescription-modal-overlay"
            onMouseDown={closeViewModal}
          >
            <div
              className="prescription-modal prescription-view-modal"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <div className="prescription-modal-header">
                <div>
                  <h2>Prescription Details</h2>

                  <p>
                    Digital prescription
                    information
                  </p>
                </div>

                <button
                  className="prescription-modal-close"
                  onClick={closeViewModal}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="prescription-profile">
                <div className="prescription-profile-icon">
                  <Pill size={28} />
                </div>

                <div>
                  <h3>
                    {getPatientName(
                      selectedPrescription
                    )}
                  </h3>

                  <p>
                    {getPatientCode(
                      selectedPrescription
                    )}
                  </p>

                  <span className="prescription-badge">
                    <Check size={12} />
                    {selectedPrescription.isActive ===
                    false
                      ? "Inactive"
                      : "Active"}
                  </span>
                </div>
              </div>

              <div className="prescription-detail-grid">
                <div>
                  <span>
                    <Stethoscope size={14} />
                    Doctor
                  </span>

                  <strong>
                    {getDoctorName(
                      selectedPrescription
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    <Activity size={14} />
                    Specialization
                  </span>

                  <strong>
                    {getSpecialization(
                      selectedPrescription
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    <CalendarDays size={14} />
                    Prescription Date
                  </span>

                  <strong>
                    {formatDate(
                      selectedPrescription.prescriptionDate
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    <FileText size={14} />
                    Diagnosis
                  </span>

                  <strong>
                    {selectedPrescription
                      .medicalRecord
                      ?.diagnosis || "N/A"}
                  </strong>
                </div>
              </div>

              <div className="prescription-view-section">
                <div className="prescription-view-title">
                  <Pill size={16} />
                  Medicines
                </div>

                <div className="prescription-medicine-view-list">
                  {selectedPrescription.medicines?.map(
                    (medicine, index) => (
                      <div
                        className="prescription-medicine-view"
                        key={index}
                      >
                        <div className="medicine-view-number">
                          {index + 1}
                        </div>

                        <div className="medicine-view-main">
                          <strong>
                            {medicine.name}
                          </strong>

                          <div className="medicine-view-meta">
                            <span>
                              {
                                medicine.dosage
                              }
                            </span>

                            <span>
                              {
                                medicine.frequency
                              }
                            </span>

                            <span>
                              {
                                medicine.duration
                              }
                            </span>

                            <span>
                              {medicine.route ||
                                "Oral"}
                            </span>
                          </div>

                          {medicine.instructions && (
                            <p>
                              {
                                medicine.instructions
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {selectedPrescription.generalInstructions && (
                <div className="prescription-info-block">
                  <span>
                    <FileText size={14} />
                    General Instructions
                  </span>

                  <p>
                    {
                      selectedPrescription.generalInstructions
                    }
                  </p>
                </div>
              )}

              {selectedPrescription.advice && (
                <div className="prescription-info-block">
                  <span>
                    <HeartPulse size={14} />
                    Advice
                  </span>

                  <p>
                    {selectedPrescription.advice}
                  </p>
                </div>
              )}

              {selectedPrescription.followUpDate && (
                <div className="prescription-follow-up">
                  <span>
                    <CalendarDays size={14} />
                    Follow-up
                  </span>

                  <strong>
                    {formatDate(
                      selectedPrescription.followUpDate
                    )}
                  </strong>
                </div>
              )}

              <div className="prescription-modal-footer">
                <button
                  className="prescription-secondary-button"
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

export default Prescription;