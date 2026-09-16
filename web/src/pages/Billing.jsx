import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  Banknote,
  CalendarDays,
  Check,
  CreditCard,
  Eye,
  FileText,
  Plus,
  Receipt,
  Search,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import "./Billing.css";

const API_URL = import.meta.env.VITE_API_URL;

const initialForm = {
  patient: "",
  doctor: "",
  appointment: "",
  consultationFee: "",
  additionalCharges: "0",
  discount: "0",
  tax: "0",
  paidAmount: "0",
  paymentMethod: "cash",
  paymentDate: "",
  notes: "",
};

const Billing = () => {
  const navigate = useNavigate();

  const [billings, setBillings] = useState([]);
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

  const [selectedBilling, setSelectedBilling] =
    useState(null);

  const [form, setForm] = useState(initialForm);

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
        billingsResponse,
        patientsResponse,
        doctorsResponse,
        appointmentsResponse,
      ] = await Promise.all([
        axios.get(
          `${API_URL}/billing`,
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

      setBillings(
        normalizeList(
          billingsResponse,
          "billings"
        )
      );

      setPatients(
        normalizeList(
          patientsResponse,
          "patients"
        )
      );

      setDoctors(
        normalizeList(
          doctorsResponse,
          "doctors"
        )
      );

      setAppointments(
        normalizeList(
          appointmentsResponse,
          "appointments"
        )
      );
    } catch (err) {
      console.error(
        "Fetch billing error:",
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
          "Unable to load billing records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeBillings = billings.filter(
    (billing) =>
      billing?.isActive !== false
  );

  const totalBilled = activeBillings.reduce(
    (total, billing) =>
      total + Number(billing.totalAmount || 0),
    0
  );

  const totalPaid = activeBillings.reduce(
    (total, billing) =>
      total + Number(billing.paidAmount || 0),
    0
  );

  const pendingAmount = Math.max(
    totalBilled - totalPaid,
    0
  );

  const paidInvoices = activeBillings.filter(
    (billing) =>
      billing.paymentStatus === "paid"
  ).length;

  const filteredBillings = useMemo(() => {
    const search = searchTerm
      .toLowerCase()
      .trim();

    if (!search) {
      return billings;
    }

    return billings.filter((billing) => {
      const invoice =
        billing?.invoiceNumber || "";

      const patient =
        billing?.patient?.name || "";

      const patientId =
        billing?.patient?.patientId || "";

      const doctor =
        billing?.doctor?.user?.name ||
        billing?.doctor?.name ||
        "";

      const status =
        billing?.paymentStatus || "";

      return (
        invoice
          .toLowerCase()
          .includes(search) ||
        patient
          .toLowerCase()
          .includes(search) ||
        patientId
          .toLowerCase()
          .includes(search) ||
        doctor
          .toLowerCase()
          .includes(search) ||
        status
          .toLowerCase()
          .includes(search)
      );
    });
  }, [billings, searchTerm]);

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

  const calculatedTotal = useMemo(() => {
    const consultation =
      Number(form.consultationFee) || 0;

    const additional =
      Number(form.additionalCharges) || 0;

    const discount =
      Number(form.discount) || 0;

    const tax = Number(form.tax) || 0;

    return Math.max(
      consultation +
        additional -
        discount +
        tax,
      0
    );
  }, [
    form.consultationFee,
    form.additionalCharges,
    form.discount,
    form.tax,
  ]);

  const calculatedPending = Math.max(
    calculatedTotal -
      (Number(form.paidAmount) || 0),
    0
  );

  const calculatedStatus = useMemo(() => {
    const paid =
      Number(form.paidAmount) || 0;

    if (paid <= 0) {
      return "pending";
    }

    if (paid >= calculatedTotal) {
      return "paid";
    }

    return "partial";
  }, [
    form.paidAmount,
    calculatedTotal,
  ]);

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
      doctor: "",
      consultationFee: "",
    }));
  };

  const handleDoctorChange = (event) => {
    const doctorId = event.target.value;

    setForm((previous) => ({
      ...previous,
      doctor: doctorId,
      appointment: "",
      consultationFee: "",
    }));
  };

  const handleAppointmentChange = (event) => {
    const appointmentId =
      event.target.value;

    const appointment =
      appointments.find(
        (item) =>
          String(item._id) ===
          String(appointmentId)
      );

    setForm((previous) => ({
      ...previous,
      appointment: appointmentId,
      consultationFee:
        appointment?.consultationFee ??
        previous.consultationFee,
    }));
  };

  const openAddModal = () => {
    setForm({
      ...initialForm,
      paymentDate: new Date()
        .toISOString()
        .split("T")[0],
    });

    setError("");
    setSuccess("");
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    if (submitting) {
      return;
    }

    setShowAddModal(false);
    setForm(initialForm);
    setError("");
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
      setError(
        "Please select an appointment."
      );
      return;
    }

    if (
      Number(form.paidAmount) >
      calculatedTotal
    ) {
      setError(
        "Paid amount cannot be greater than the total amount."
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        patient: form.patient,
        doctor: form.doctor,
        appointment: form.appointment,
        consultationFee:
          Number(form.consultationFee) || 0,
        additionalCharges:
          Number(form.additionalCharges) || 0,
        discount:
          Number(form.discount) || 0,
        tax: Number(form.tax) || 0,
        paidAmount:
          Number(form.paidAmount) || 0,
        paymentMethod:
          form.paymentMethod,
        paymentDate:
          form.paymentDate || undefined,
        notes: form.notes.trim(),
      };

      const response = await axios.post(
        `${API_URL}/billing`,
        payload,
        getAuthConfig()
      );

      setSuccess(
        response.data?.message ||
          "Billing record created successfully."
      );

      setShowAddModal(false);
      setForm(initialForm);

      await fetchData();
    } catch (err) {
      console.error(
        "Create billing error:",
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
          "Unable to create billing record."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openViewModal = (billing) => {
    setSelectedBilling(billing);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setSelectedBilling(null);
    setShowViewModal(false);
  };

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

  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString(
      "en-IN"
    )}`;

  const getPatientName = (billing) =>
    billing?.patient?.name ||
    "Unknown Patient";

  const getPatientCode = (billing) =>
    billing?.patient?.patientId ||
    "N/A";

  const getDoctorName = (billing) =>
    billing?.doctor?.user?.name ||
    billing?.doctor?.name ||
    "Unknown Doctor";

  const getDoctorSpecialization = (
    billing
  ) =>
    billing?.doctor?.specialization ||
    "General";

  const statusClass = (status) => {
    if (status === "paid") {
      return "billing-status paid";
    }

    if (status === "partial") {
      return "billing-status partial";
    }

    if (status === "refunded") {
      return "billing-status refunded";
    }

    return "billing-status pending";
  };

  return (
    <div className="billing-page">
      <div className="billing-header">
        <div>
          <div className="billing-breadcrumb">
            <span>Clinic</span>
            <span>/</span>
            <span>Billing</span>
          </div>

          <h1>Billing & Payments</h1>

          <p>
            Manage invoices, payments and
            outstanding patient balances.
          </p>
        </div>

        <button
          className="billing-primary-button"
          onClick={openAddModal}
        >
          <Plus size={18} />
          New Invoice
        </button>
      </div>

      {success && (
        <div className="billing-alert billing-success">
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
        <div className="billing-alert billing-error">
          <Activity size={18} />
          <span>{error}</span>

          <button
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="billing-stats">
        <div className="billing-stat-card">
          <div className="billing-stat-icon">
            <Receipt size={21} />
          </div>

          <div>
            <span>Total Billed</span>
            <strong>
              {formatCurrency(totalBilled)}
            </strong>
          </div>
        </div>

        <div className="billing-stat-card">
          <div className="billing-stat-icon">
            <Check size={21} />
          </div>

          <div>
            <span>Total Paid</span>
            <strong>
              {formatCurrency(totalPaid)}
            </strong>
          </div>
        </div>

        <div className="billing-stat-card">
          <div className="billing-stat-icon">
            <WalletCards size={21} />
          </div>

          <div>
            <span>Pending Amount</span>
            <strong>
              {formatCurrency(
                pendingAmount
              )}
            </strong>
          </div>
        </div>

        <div className="billing-stat-card">
          <div className="billing-stat-icon">
            <FileText size={21} />
          </div>

          <div>
            <span>Paid Invoices</span>
            <strong>{paidInvoices}</strong>
          </div>
        </div>
      </div>

      <div className="billing-content-card">
        <div className="billing-content-header">
          <div>
            <h2>Invoice Directory</h2>

            <p>
              {filteredBillings.length} invoice
              {filteredBillings.length !==
              1
                ? "s"
                : ""}{" "}
              found
            </p>
          </div>

          <div className="billing-search">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search invoice, patient, doctor..."
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
          <div className="billing-empty">
            <div className="billing-loading"></div>

            <h3>Loading invoices...</h3>

            <p>
              Please wait while we fetch
              billing records.
            </p>
          </div>
        ) : filteredBillings.length ===
          0 ? (
          <div className="billing-empty">
            <div className="billing-empty-icon">
              <Receipt size={30} />
            </div>

            <h3>No invoices found</h3>

            <p>
              {searchTerm
                ? "Try changing your search term."
                : "Create the first invoice to get started."}
            </p>

            {!searchTerm && (
              <button
                className="billing-primary-button"
                onClick={openAddModal}
              >
                <Plus size={18} />
                New Invoice
              </button>
            )}
          </div>
        ) : (
          <div className="billing-table-wrapper">
            <table className="billing-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredBillings.map(
                  (billing) => (
                    <tr key={billing._id}>
                      <td>
                        <div className="billing-invoice">
                          <div className="billing-invoice-icon">
                            <Receipt
                              size={16}
                            />
                          </div>

                          <strong>
                            {
                              billing.invoiceNumber
                            }
                          </strong>
                        </div>
                      </td>

                      <td>
                        <div className="billing-person">
                          <div className="billing-avatar">
                            <UserRound
                              size={16}
                            />
                          </div>

                          <div>
                            <strong>
                              {getPatientName(
                                billing
                              )}
                            </strong>

                            <span>
                              {getPatientCode(
                                billing
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="billing-doctor">
                          <strong>
                            {getDoctorName(
                              billing
                            )}
                          </strong>

                          <span>
                            {getDoctorSpecialization(
                              billing
                            )}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="billing-date">
                          <CalendarDays
                            size={14}
                          />
                          {formatDate(
                            billing.createdAt
                          )}
                        </div>
                      </td>

                      <td>
                        <strong className="billing-total">
                          {formatCurrency(
                            billing.totalAmount
                          )}
                        </strong>
                      </td>

                      <td>
                        <strong className="billing-paid">
                          {formatCurrency(
                            billing.paidAmount
                          )}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={statusClass(
                            billing.paymentStatus
                          )}
                        >
                          <Check size={12} />

                          {billing.paymentStatus
                            ?.charAt(0)
                            .toUpperCase() +
                            billing.paymentStatus?.slice(
                              1
                            )}
                        </span>
                      </td>

                      <td>
                        <button
                          className="billing-view-button"
                          onClick={() =>
                            openViewModal(
                              billing
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
          className="billing-modal-overlay"
          onMouseDown={closeAddModal}
        >
          <div
            className="billing-modal billing-add-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="billing-modal-header">
              <div>
                <h2>New Invoice</h2>

                <p>
                  Create a billing record for
                  a patient appointment.
                </p>
              </div>

              <button
                className="billing-modal-close"
                type="button"
                onClick={closeAddModal}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="billing-alert billing-error billing-modal-alert">
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
              className="billing-form"
              onSubmit={handleSubmit}
            >
              <div className="billing-form-section">
                <div className="billing-form-title">
                  <UserRound size={18} />
                  Appointment
                </div>

                <div className="billing-form-grid">
                  <div className="billing-form-group">
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

                  <div className="billing-form-group">
                    <label>
                      Doctor <span>*</span>
                    </label>

                    <select
                      value={form.doctor}
                      onChange={
                        handleDoctorChange
                      }
                      disabled={!form.patient}
                      required
                    >
                      <option value="">
                        {!form.patient
                          ? "Select patient first"
                          : "Select doctor"}
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

                  <div className="billing-form-group billing-form-full">
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
                </div>
              </div>

              <div className="billing-form-section">
                <div className="billing-form-title">
                  <Banknote size={18} />
                  Amount Details
                </div>

                <div className="billing-form-grid">
                  <div className="billing-form-group">
                    <label>
                      Consultation Fee
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="consultationFee"
                      value={
                        form.consultationFee
                      }
                      onChange={
                        handleInputChange
                      }
                      placeholder="0"
                    />
                  </div>

                  <div className="billing-form-group">
                    <label>
                      Additional Charges
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="additionalCharges"
                      value={
                        form.additionalCharges
                      }
                      onChange={
                        handleInputChange
                      }
                      placeholder="0"
                    />
                  </div>

                  <div className="billing-form-group">
                    <label>Discount</label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="discount"
                      value={form.discount}
                      onChange={
                        handleInputChange
                      }
                      placeholder="0"
                    />
                  </div>

                  <div className="billing-form-group">
                    <label>Tax</label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="tax"
                      value={form.tax}
                      onChange={
                        handleInputChange
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="billing-calculation">
                  <div>
                    <span>Consultation</span>
                    <strong>
                      {formatCurrency(
                        form.consultationFee
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Additional</span>
                    <strong>
                      {formatCurrency(
                        form.additionalCharges
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Discount</span>
                    <strong className="billing-minus">
                      -{" "}
                      {formatCurrency(
                        form.discount
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Tax</span>
                    <strong>
                      {formatCurrency(
                        form.tax
                      )}
                    </strong>
                  </div>

                  <div className="billing-calculation-total">
                    <span>Total Amount</span>
                    <strong>
                      {formatCurrency(
                        calculatedTotal
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="billing-form-section">
                <div className="billing-form-title">
                  <CreditCard size={18} />
                  Payment
                </div>

                <div className="billing-form-grid">
                  <div className="billing-form-group">
                    <label>
                      Paid Amount
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="paidAmount"
                      value={
                        form.paidAmount
                      }
                      onChange={
                        handleInputChange
                      }
                      placeholder="0"
                    />
                  </div>

                  <div className="billing-form-group">
                    <label>
                      Payment Method
                    </label>

                    <select
                      name="paymentMethod"
                      value={
                        form.paymentMethod
                      }
                      onChange={
                        handleInputChange
                      }
                    >
                      <option value="cash">
                        Cash
                      </option>
                      <option value="card">
                        Card
                      </option>
                      <option value="upi">
                        UPI
                      </option>
                      <option value="bank-transfer">
                        Bank Transfer
                      </option>
                      <option value="other">
                        Other
                      </option>
                    </select>
                  </div>

                  <div className="billing-form-group">
                    <label>
                      Payment Date
                    </label>

                    <input
                      type="date"
                      name="paymentDate"
                      value={
                        form.paymentDate
                      }
                      onChange={
                        handleInputChange
                      }
                    />
                  </div>

                  <div className="billing-payment-summary">
                    <span>
                      Payment Status
                    </span>

                    <strong
                      className={statusClass(
                        calculatedStatus
                      )}
                    >
                      {calculatedStatus
                        .charAt(0)
                        .toUpperCase() +
                        calculatedStatus.slice(
                          1
                        )}
                    </strong>

                    <small>
                      Pending:{" "}
                      {formatCurrency(
                        calculatedPending
                      )}
                    </small>
                  </div>
                </div>
              </div>

              <div className="billing-form-section">
                <div className="billing-form-title">
                  <FileText size={18} />
                  Notes
                </div>

                <div className="billing-form-group">
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={
                      handleInputChange
                    }
                    rows="3"
                    placeholder="Add invoice notes..."
                  />
                </div>
              </div>

              <div className="billing-modal-footer">
                <button
                  type="button"
                  className="billing-secondary-button"
                  onClick={closeAddModal}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="billing-primary-button"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="billing-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Create Invoice
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal &&
        selectedBilling && (
          <div
            className="billing-modal-overlay"
            onMouseDown={closeViewModal}
          >
            <div
              className="billing-modal billing-view-modal"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <div className="billing-modal-header">
                <div>
                  <h2>Invoice Details</h2>

                  <p>
                    Complete billing and
                    payment information.
                  </p>
                </div>

                <button
                  className="billing-modal-close"
                  onClick={closeViewModal}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="billing-invoice-banner">
                <div className="billing-large-invoice-icon">
                  <Receipt size={26} />
                </div>

                <div>
                  <span>Invoice Number</span>

                  <strong>
                    {
                      selectedBilling.invoiceNumber
                    }
                  </strong>
                </div>

                <span
                  className={statusClass(
                    selectedBilling.paymentStatus
                  )}
                >
                  {selectedBilling.paymentStatus
                    ?.charAt(0)
                    .toUpperCase() +
                    selectedBilling.paymentStatus?.slice(
                      1
                    )}
                </span>
              </div>

              <div className="billing-detail-grid">
                <div>
                  <span>
                    <UserRound size={14} />
                    Patient
                  </span>

                  <strong>
                    {getPatientName(
                      selectedBilling
                    )}
                  </strong>

                  <small>
                    {getPatientCode(
                      selectedBilling
                    )}
                  </small>
                </div>

                <div>
                  <span>
                    <UserRound size={14} />
                    Doctor
                  </span>

                  <strong>
                    {getDoctorName(
                      selectedBilling
                    )}
                  </strong>

                  <small>
                    {getDoctorSpecialization(
                      selectedBilling
                    )}
                  </small>
                </div>

                <div>
                  <span>
                    <CalendarDays size={14} />
                    Invoice Date
                  </span>

                  <strong>
                    {formatDate(
                      selectedBilling.createdAt
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    <CreditCard size={14} />
                    Payment Method
                  </span>

                  <strong>
                    {selectedBilling.paymentMethod
                      ?.split("-")
                      .map(
                        (word) =>
                          word
                            .charAt(0)
                            .toUpperCase() +
                          word.slice(1)
                      )
                      .join(" ")}
                  </strong>
                </div>
              </div>

              <div className="billing-breakdown">
                <h3>Amount Breakdown</h3>

                <div>
                  <span>
                    Consultation Fee
                  </span>

                  <strong>
                    {formatCurrency(
                      selectedBilling.consultationFee
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Additional Charges
                  </span>

                  <strong>
                    {formatCurrency(
                      selectedBilling.additionalCharges
                    )}
                  </strong>
                </div>

                <div>
                  <span>Discount</span>

                  <strong className="billing-minus">
                    -{" "}
                    {formatCurrency(
                      selectedBilling.discount
                    )}
                  </strong>
                </div>

                <div>
                  <span>Tax</span>

                  <strong>
                    {formatCurrency(
                      selectedBilling.tax
                    )}
                  </strong>
                </div>

                <div className="billing-breakdown-total">
                  <span>Total Amount</span>

                  <strong>
                    {formatCurrency(
                      selectedBilling.totalAmount
                    )}
                  </strong>
                </div>

                <div className="billing-breakdown-paid">
                  <span>Paid Amount</span>

                  <strong>
                    {formatCurrency(
                      selectedBilling.paidAmount
                    )}
                  </strong>
                </div>

                <div className="billing-breakdown-pending">
                  <span>Pending Amount</span>

                  <strong>
                    {formatCurrency(
                      Math.max(
                        Number(
                          selectedBilling.totalAmount
                        ) -
                          Number(
                            selectedBilling.paidAmount
                          ),
                        0
                      )
                    )}
                  </strong>
                </div>
              </div>

              {selectedBilling.notes && (
                <div className="billing-notes">
                  <span>
                    <FileText size={14} />
                    Notes
                  </span>

                  <p>
                    {selectedBilling.notes}
                  </p>
                </div>
              )}

              <div className="billing-modal-footer">
                <button
                  className="billing-secondary-button"
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

export default Billing;