import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  CalendarDays,
  Eye,
  FileText,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";

import "./Patients.css";

const initialForm = {
  name: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  email: "",
  address: "",
  bloodGroup: "unknown",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelationship: "",
  medicalHistory: "",
  allergies: "",
  notes: "",
};

const getInitials = (name) => {
  if (!name) return "PT";

  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatGender = (gender) => {
  if (!gender) return "—";
  return gender.charAt(0).toUpperCase() + gender.slice(1);
};

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(initialForm);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const getToken = () => {
    return localStorage.getItem("clinic_token");
  };

  const handleUnauthorized = () => {
    localStorage.removeItem("clinic_token");
    localStorage.removeItem("clinic_user");
    window.location.href = "/login";
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/patients`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPatients(response.data.data.patients || []);
    } catch (requestError) {
      console.error("Patients fetch error:", requestError);

      if (requestError.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(
        requestError.response?.data?.message ||
          "Unable to load patients."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return patients;
    }

    return patients.filter((patient) => {
      return (
        patient.name?.toLowerCase().includes(query) ||
        patient.patientId?.toLowerCase().includes(query) ||
        patient.phone?.toLowerCase().includes(query) ||
        patient.email?.toLowerCase().includes(query)
      );
    });
  }, [patients, searchTerm]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const openAddModal = () => {
    setForm(initialForm);
    setFormError("");
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    if (saving) return;

    setShowAddModal(false);
    setForm(initialForm);
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setFormError("");

      const token = getToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      const allergies = form.allergies
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const payload = {
        name: form.name,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        phone: form.phone,
        email: form.email || undefined,
        address: form.address || undefined,
        bloodGroup: form.bloodGroup,
        emergencyContact: {
          name: form.emergencyName || undefined,
          phone: form.emergencyPhone || undefined,
          relationship: form.emergencyRelationship || undefined,
        },
        medicalHistory: form.medicalHistory || undefined,
        allergies,
        notes: form.notes || undefined,
      };

      await axios.post(
        `${import.meta.env.VITE_API_URL}/patients`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      closeAddModal();
      await fetchPatients();
    } catch (requestError) {
      console.error("Create patient error:", requestError);

      if (requestError.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setFormError(
        requestError.response?.data?.message ||
          "Unable to create patient."
      );
    } finally {
      setSaving(false);
    }
  };

  const openViewModal = async (patient) => {
    setSelectedPatient(patient);
    setMedicalRecords([]);
    setDetailsError("");
    setShowViewModal(true);
    setLoadingDetails(true);

    try {
      const token = getToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      const [patientResponse, recordsResponse] = await Promise.all([
        axios.get(
          `${import.meta.env.VITE_API_URL}/patients/${patient._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
        axios.get(
          `${import.meta.env.VITE_API_URL}/medical-records/patient/${patient._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
      ]);

      setSelectedPatient(
        patientResponse.data.data.patient || patient
      );

      setMedicalRecords(
        recordsResponse.data.data.medicalRecords || []
      );
    } catch (requestError) {
      console.error("Patient details error:", requestError);

      if (requestError.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setDetailsError(
        requestError.response?.data?.message ||
          "Unable to load patient details."
      );
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeViewModal = () => {
    if (loadingDetails) return;

    setShowViewModal(false);
    setSelectedPatient(null);
    setMedicalRecords([]);
    setDetailsError("");
  };

  return (
    <div className="patients-page">
      <div className="patients-page-header">
        <div>
          <p className="patients-eyebrow">CLINIC MANAGEMENT</p>

          <h1>Patients</h1>

          <p className="patients-subtitle">
            Manage patient profiles and medical information.
          </p>
        </div>

        <button
          className="patients-primary-button"
          onClick={openAddModal}
        >
          <Plus size={18} />
          Add Patient
        </button>
      </div>

      <div className="patients-summary">
        <div className="patients-summary-icon">
          <Users size={21} />
        </div>

        <div>
          <strong>{patients.length}</strong>
          <span>Active Patients</span>
        </div>
      </div>

      <div className="patients-panel">
        <div className="patients-toolbar">
          <div>
            <h2>Patient Directory</h2>

            <p>
              {filteredPatients.length} patient
              {filteredPatients.length !== 1 ? "s" : ""} found
            </p>
          </div>

          <div className="patients-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search by name, ID, phone..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />
          </div>
        </div>

        {error && (
          <div className="patients-error">
            {error}
          </div>
        )}

        <div className="patients-table-wrapper">
          {loading ? (
            <div className="patients-empty">
              <div className="patients-loading-icon">
                <Users size={24} />
              </div>

              <strong>Loading patients...</strong>

              <span>
                Fetching patient records from the clinic database.
              </span>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="patients-empty">
              <div className="patients-loading-icon">
                <UserRound size={24} />
              </div>

              <strong>No patients found</strong>

              <span>
                Try a different search or add a new patient.
              </span>
            </div>
          ) : (
            <table className="patients-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Patient ID</th>
                  <th>Contact</th>
                  <th>Gender</th>
                  <th>Blood Group</th>
                  <th>Registered</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient._id}>
                    <td>
                      <div className="patient-cell">
                        <div className="patient-table-avatar">
                          {getInitials(patient.name)}
                        </div>

                        <div>
                          <strong>{patient.name}</strong>
                          <span>
                            {patient.email || "No email"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="patient-id">
                        {patient.patientId}
                      </span>
                    </td>

                    <td>
                      <span className="contact-text">
                        {patient.phone}
                      </span>
                    </td>

                    <td>
                      <span className="capitalize-text">
                        {formatGender(patient.gender)}
                      </span>
                    </td>

                    <td>
                      <span className="blood-group">
                        {patient.bloodGroup || "Unknown"}
                      </span>
                    </td>

                    <td>
                      <span className="date-text">
                        {formatDate(patient.createdAt)}
                      </span>
                    </td>

                    <td>
                      <span className="patient-status">
                        <span />
                        Active
                      </span>
                    </td>

                    <td>
                      <button
                        className="patient-view-button"
                        title="View patient"
                        onClick={() =>
                          openViewModal(patient)
                        }
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Patient Modal */}

      {showAddModal && (
        <div
          className="patient-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAddModal();
            }
          }}
        >
          <div className="patient-modal">
            <div className="patient-modal-header">
              <div>
                <h2>Add New Patient</h2>

                <p>
                  Create a new patient profile in the clinic system.
                </p>
              </div>

              <button
                className="modal-close-button"
                onClick={closeAddModal}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="patient-form"
              onSubmit={handleSubmit}
            >
              <div className="form-section">
                <div className="form-section-title">
                  <UserRound size={17} />
                  <span>Basic Information</span>
                </div>

                <div className="form-grid">
                  <div className="patient-form-group full">
                    <label htmlFor="name">
                      Full Name <span>*</span>
                    </label>

                    <div className="patient-input">
                      <UserRound size={16} />

                      <input
                        id="name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Enter patient's full name"
                        required
                      />
                    </div>
                  </div>

                  <div className="patient-form-group">
                    <label htmlFor="dateOfBirth">
                      Date of Birth <span>*</span>
                    </label>

                    <div className="patient-input">
                      <CalendarDays size={16} />

                      <input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={form.dateOfBirth}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="patient-form-group">
                    <label htmlFor="gender">
                      Gender <span>*</span>
                    </label>

                    <select
                      id="gender"
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      required
                    >
                      <option value="">
                        Select gender
                      </option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="patient-form-group">
                    <label htmlFor="phone">
                      Phone Number <span>*</span>
                    </label>

                    <div className="patient-input">
                      <Phone size={16} />

                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                        required
                      />
                    </div>
                  </div>

                  <div className="patient-form-group">
                    <label htmlFor="email">
                      Email Address
                    </label>

                    <div className="patient-input">
                      <Mail size={16} />

                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="patient@example.com"
                      />
                    </div>
                  </div>

                  <div className="patient-form-group">
                    <label htmlFor="bloodGroup">
                      Blood Group
                    </label>

                    <select
                      id="bloodGroup"
                      name="bloodGroup"
                      value={form.bloodGroup}
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

                  <div className="patient-form-group full">
                    <label htmlFor="address">
                      Address
                    </label>

                    <div className="patient-input">
                      <MapPin size={16} />

                      <input
                        id="address"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Enter complete address"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">
                  <Phone size={17} />
                  <span>Emergency Contact</span>
                </div>

                <div className="form-grid">
                  <div className="patient-form-group">
                    <label htmlFor="emergencyName">
                      Contact Name
                    </label>

                    <input
                      id="emergencyName"
                      name="emergencyName"
                      value={form.emergencyName}
                      onChange={handleChange}
                      placeholder="Emergency contact name"
                    />
                  </div>

                  <div className="patient-form-group">
                    <label htmlFor="emergencyPhone">
                      Contact Phone
                    </label>

                    <input
                      id="emergencyPhone"
                      name="emergencyPhone"
                      type="tel"
                      value={form.emergencyPhone}
                      onChange={handleChange}
                      placeholder="Emergency contact number"
                    />
                  </div>

                  <div className="patient-form-group full">
                    <label htmlFor="emergencyRelationship">
                      Relationship
                    </label>

                    <input
                      id="emergencyRelationship"
                      name="emergencyRelationship"
                      value={form.emergencyRelationship}
                      onChange={handleChange}
                      placeholder="e.g. Father, Mother, Spouse"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">
                  <FileText size={17} />
                  <span>Medical Information</span>
                </div>

                <div className="form-grid">
                  <div className="patient-form-group full">
                    <label htmlFor="medicalHistory">
                      Medical History
                    </label>

                    <textarea
                      id="medicalHistory"
                      name="medicalHistory"
                      value={form.medicalHistory}
                      onChange={handleChange}
                      placeholder="Previous illnesses, surgeries, conditions..."
                      rows="3"
                    />
                  </div>

                  <div className="patient-form-group full">
                    <label htmlFor="allergies">
                      Allergies
                    </label>

                    <input
                      id="allergies"
                      name="allergies"
                      value={form.allergies}
                      onChange={handleChange}
                      placeholder="Separate multiple allergies with commas"
                    />
                  </div>

                  <div className="patient-form-group full">
                    <label htmlFor="notes">
                      Notes
                    </label>

                    <textarea
                      id="notes"
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      placeholder="Additional notes about the patient..."
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              {formError && (
                <div className="patients-error modal-error">
                  {formError}
                </div>
              )}

              <div className="patient-form-footer">
                <button
                  type="button"
                  className="modal-cancel-button"
                  onClick={closeAddModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="patients-primary-button"
                  disabled={saving}
                >
                  <Plus size={17} />
                  {saving
                    ? "Creating..."
                    : "Create Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Patient Modal */}

      {showViewModal && selectedPatient && (
        <div
          className="patient-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeViewModal();
            }
          }}
        >
          <div className="patient-view-modal">
            <div className="patient-modal-header">
              <div className="patient-view-heading">
                <div className="patient-large-avatar">
                  {getInitials(selectedPatient.name)}
                </div>

                <div>
                  <h2>{selectedPatient.name}</h2>

                  <p>
                    {selectedPatient.patientId}
                    {" • "}
                    Registered{" "}
                    {formatDate(selectedPatient.createdAt)}
                  </p>
                </div>
              </div>

              <button
                className="modal-close-button"
                onClick={closeViewModal}
                disabled={loadingDetails}
              >
                <X size={20} />
              </button>
            </div>

            {loadingDetails ? (
              <div className="patient-details-loading">
                <div className="patients-loading-icon">
                  <Activity size={24} />
                </div>

                <strong>Loading patient profile...</strong>

                <span>
                  Fetching patient information and medical history.
                </span>
              </div>
            ) : (
              <div className="patient-details-content">
                {detailsError && (
                  <div className="patients-error modal-error">
                    {detailsError}
                  </div>
                )}

                <div className="patient-detail-section">
                  <div className="detail-section-title">
                    <UserRound size={17} />
                    <span>Personal Information</span>
                  </div>

                  <div className="patient-detail-grid">
                    <div>
                      <span>Full Name</span>
                      <strong>{selectedPatient.name}</strong>
                    </div>

                    <div>
                      <span>Patient ID</span>
                      <strong className="blue-detail">
                        {selectedPatient.patientId}
                      </strong>
                    </div>

                    <div>
                      <span>Date of Birth</span>
                      <strong>
                        {formatDate(
                          selectedPatient.dateOfBirth
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Gender</span>
                      <strong>
                        {formatGender(selectedPatient.gender)}
                      </strong>
                    </div>

                    <div>
                      <span>Phone</span>
                      <strong>
                        {selectedPatient.phone || "—"}
                      </strong>
                    </div>

                    <div>
                      <span>Email</span>
                      <strong>
                        {selectedPatient.email || "—"}
                      </strong>
                    </div>

                    <div>
                      <span>Blood Group</span>
                      <strong>
                        {selectedPatient.bloodGroup ||
                          "Unknown"}
                      </strong>
                    </div>

                    <div>
                      <span>Status</span>
                      <strong className="active-detail">
                        Active
                      </strong>
                    </div>

                    <div className="full-detail">
                      <span>Address</span>
                      <strong>
                        {selectedPatient.address || "—"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="patient-detail-section">
                  <div className="detail-section-title">
                    <Phone size={17} />
                    <span>Emergency Contact</span>
                  </div>

                  <div className="patient-detail-grid">
                    <div>
                      <span>Name</span>
                      <strong>
                        {selectedPatient.emergencyContact
                          ?.name || "—"}
                      </strong>
                    </div>

                    <div>
                      <span>Phone</span>
                      <strong>
                        {selectedPatient.emergencyContact
                          ?.phone || "—"}
                      </strong>
                    </div>

                    <div>
                      <span>Relationship</span>
                      <strong>
                        {selectedPatient.emergencyContact
                          ?.relationship || "—"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="patient-detail-section">
                  <div className="detail-section-title">
                    <Activity size={17} />
                    <span>Medical Information</span>
                  </div>

                  <div className="medical-info-card">
                    <div>
                      <span>Medical History</span>
                      <p>
                        {selectedPatient.medicalHistory ||
                          "No medical history recorded."}
                      </p>
                    </div>

                    <div>
                      <span>Allergies</span>

                      {selectedPatient.allergies?.length ? (
                        <div className="allergy-list">
                          {selectedPatient.allergies.map(
                            (allergy, index) => (
                              <span key={index}>
                                {allergy}
                              </span>
                            )
                          )}
                        </div>
                      ) : (
                        <p>No known allergies recorded.</p>
                      )}
                    </div>

                    <div>
                      <span>Notes</span>
                      <p>
                        {selectedPatient.notes ||
                          "No additional notes."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="patient-detail-section">
                  <div className="detail-section-title">
                    <FileText size={17} />
                    <span>Medical Records</span>
                  </div>

                  {medicalRecords.length === 0 ? (
                    <div className="no-records">
                      <FileText size={20} />

                      <span>
                        No medical records available.
                      </span>
                    </div>
                  ) : (
                    <div className="medical-record-list">
                      {medicalRecords.map((record) => (
                        <div
                          className="medical-record-card"
                          key={record._id}
                        >
                          <div className="record-date">
                            <CalendarDays size={15} />
                            {formatDate(record.visitDate)}
                          </div>

                          <div className="record-content">
                            <strong>
                              {record.diagnosis}
                            </strong>

                            <p>
                              <b>Complaint:</b>{" "}
                              {record.chiefComplaint}
                            </p>

                            {record.treatmentPlan && (
                              <p>
                                <b>Treatment:</b>{" "}
                                {record.treatmentPlan}
                              </p>
                            )}

                            {record.followUpDate && (
                              <p>
                                <b>Follow-up:</b>{" "}
                                {formatDate(
                                  record.followUpDate
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;