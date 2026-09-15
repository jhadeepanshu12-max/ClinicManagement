import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Eye,
  Plus,
  Search,
  UserRound,
  Users,
} from "lucide-react";

import "./Patients.css";

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

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("clinic_token");

        if (!token) {
          window.location.href = "/login";
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
          localStorage.removeItem("clinic_token");
          localStorage.removeItem("clinic_user");
          window.location.href = "/login";
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

        <button className="patients-primary-button">
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
                        {patient.gender || "—"}
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
    </div>
  );
};

export default Patients;