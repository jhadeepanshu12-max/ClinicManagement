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
  Pencil,
  Phone,
  Plus,
  Power,
  RotateCcw,
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
  const [actionLoading, setActionLoading] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [form, setForm] = useState({
    ...initialForm,
  });

  const [editForm, setEditForm] = useState({
    ...initialForm,
  });

  // ======================================================
  // AUTH CONFIG
  // ======================================================

  const getAuthConfig = () => {
    const token =
      localStorage.getItem("clinic_token");

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // ======================================================
  // FETCH DOCTORS
  // ======================================================

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/doctors`,
        getAuthConfig()
      );

      const responseData =
        response.data?.data;

      let doctorList = [];

      if (Array.isArray(responseData)) {
        doctorList = responseData;
      } else if (
        Array.isArray(responseData?.doctors)
      ) {
        doctorList =
          responseData.doctors;
      } else if (
        Array.isArray(response.data?.doctors)
      ) {
        doctorList =
          response.data.doctors;
      }

      setDoctors(doctorList);
    } catch (err) {
      console.error(
        "Fetch doctors error:",
        err
      );

      if (err.response?.status === 401) {
        localStorage.removeItem(
          "clinic_token"
        );
        localStorage.removeItem(
          "clinic_user"
        );

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

  // ======================================================
  // SEARCH
  // ======================================================

  const filteredDoctors = useMemo(() => {
    if (!Array.isArray(doctors)) {
      return [];
    }

    const search =
      searchTerm
        .toLowerCase()
        .trim();

    if (!search) {
      return doctors;
    }

    return doctors.filter(
      (doctor) => {
        const name =
          doctor?.user?.name || "";

        const email =
          doctor?.user?.email || "";

        const phone =
          doctor?.user?.phone || "";

        const specialization =
          doctor?.specialization || "";

        const qualification =
          doctor?.qualification || "";

        const license =
          doctor?.licenseNumber || "";

        const department =
          doctor?.department || "";

        return (
          name
            .toLowerCase()
            .includes(search) ||
          email
            .toLowerCase()
            .includes(search) ||
          phone
            .toLowerCase()
            .includes(search) ||
          specialization
            .toLowerCase()
            .includes(search) ||
          qualification
            .toLowerCase()
            .includes(search) ||
          license
            .toLowerCase()
            .includes(search) ||
          department
            .toLowerCase()
            .includes(search)
        );
      }
    );
  }, [doctors, searchTerm]);

  // ======================================================
  // STATS
  // ======================================================

  const activeDoctors =
    doctors.filter(
      (doctor) =>
        doctor?.isActive !== false
    ).length;

  const inactiveDoctors =
    doctors.length -
    activeDoctors;

  const specializations =
    new Set(
      doctors
        .map(
          (doctor) =>
            doctor?.specialization
        )
        .filter(Boolean)
    ).size;

  const averageFee =
    doctors.length > 0
      ? Math.round(
          doctors.reduce(
            (sum, doctor) =>
              sum +
              Number(
                doctor?.consultationFee ||
                  0
              ),
            0
          ) / doctors.length
        )
      : 0;

  // ======================================================
  // ADD FORM
  // ======================================================

  const handleInputChange = (
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

  const handleDayToggle = (
    day
  ) => {
    setForm(
      (previous) => {
        const isSelected =
          previous.availableDays.includes(
            day
          );

        return {
          ...previous,
          availableDays:
            isSelected
              ? previous.availableDays.filter(
                  (
                    selectedDay
                  ) =>
                    selectedDay !==
                    day
                )
              : [
                  ...previous.availableDays,
                  day,
                ],
        };
      }
    );
  };

  const resetForm = () => {
    setForm({
      ...initialForm,
    });

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

  // ======================================================
  // CREATE DOCTOR
  // ======================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError(
        "Doctor name is required."
      );
      return;
    }

    if (!form.email.trim()) {
      setError(
        "Email is required."
      );
      return;
    }

    if (
      !form.password ||
      form.password.length < 6
    ) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (
      !form.specialization.trim()
    ) {
      setError(
        "Specialization is required."
      );
      return;
    }

    if (
      !form.qualification.trim()
    ) {
      setError(
        "Qualification is required."
      );
      return;
    }

    if (
      !form.licenseNumber.trim()
    ) {
      setError(
        "License number is required."
      );
      return;
    }

    if (
      form.experience === "" ||
      Number(form.experience) < 0
    ) {
      setError(
        "Please enter valid experience."
      );
      return;
    }

    if (
      form.consultationFee === "" ||
      Number(form.consultationFee) < 0
    ) {
      setError(
        "Please enter a valid consultation fee."
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name:
          form.name.trim(),

        email:
          form.email.trim(),

        phone:
          form.phone.trim(),

        password:
          form.password,

        specialization:
          form.specialization.trim(),

        qualification:
          form.qualification.trim(),

        licenseNumber:
          form.licenseNumber.trim(),

        experience:
          Number(form.experience),

        consultationFee:
          Number(
            form.consultationFee
          ),

        availableDays:
          form.availableDays,

        availability: {
          startTime:
            form.startTime,

          endTime:
            form.endTime,
        },

        department:
          form.department.trim(),

        bio:
          form.bio.trim(),
      };

      const response =
        await axios.post(
          `${API_URL}/doctors`,
          payload,
          getAuthConfig()
        );

      setSuccess(
        response.data?.message ||
          "Doctor added successfully."
      );

      setShowAddModal(false);

      resetForm();

      await fetchDoctors();
    } catch (err) {
      console.error(
        "Add doctor error:",
        err
      );

      if (
        err.response?.status ===
        401
      ) {
        localStorage.removeItem(
          "clinic_token"
        );

        localStorage.removeItem(
          "clinic_user"
        );

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

  // ======================================================
  // VIEW DOCTOR
  // ======================================================

  const openViewModal = (
    doctor
  ) => {
    setSelectedDoctor(doctor);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setSelectedDoctor(null);
    setShowViewModal(false);
  };

  // ======================================================
  // EDIT DOCTOR
  // ======================================================

  const openEditModal = (
    doctor
  ) => {
    setSelectedDoctor(doctor);

    setEditForm({
      name:
        doctor?.user?.name || "",

      email:
        doctor?.user?.email || "",

      phone:
        doctor?.user?.phone || "",

      password: "",

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

      availableDays:
        Array.isArray(
          doctor?.availableDays
        )
          ? doctor.availableDays
          : [],

      startTime:
        doctor?.availability
          ?.startTime || "",

      endTime:
        doctor?.availability
          ?.endTime || "",

      department:
        doctor?.department || "",

      bio:
        doctor?.bio || "",
    });

    setError("");
    setSuccess("");
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    if (submitting) {
      return;
    }

    setShowEditModal(false);
    setSelectedDoctor(null);

    setEditForm({
      ...initialForm,
    });

    setError("");
  };

  const handleEditInputChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setEditForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  const handleEditDayToggle = (
    day
  ) => {
    setEditForm(
      (previous) => {
        const isSelected =
          previous.availableDays.includes(
            day
          );

        return {
          ...previous,
          availableDays:
            isSelected
              ? previous.availableDays.filter(
                  (
                    selectedDay
                  ) =>
                    selectedDay !==
                    day
                )
              : [
                  ...previous.availableDays,
                  day,
                ],
        };
      }
    );
  };

  const handleUpdateDoctor =
    async (event) => {
      event.preventDefault();

      setError("");
      setSuccess("");

      if (
        !editForm.name.trim()
      ) {
        setError(
          "Doctor name is required."
        );
        return;
      }

      if (
        !editForm.email.trim()
      ) {
        setError(
          "Email is required."
        );
        return;
      }

      if (
        !editForm.specialization.trim()
      ) {
        setError(
          "Specialization is required."
        );
        return;
      }

      if (
        !editForm.qualification.trim()
      ) {
        setError(
          "Qualification is required."
        );
        return;
      }

      if (
        !editForm.licenseNumber.trim()
      ) {
        setError(
          "License number is required."
        );
        return;
      }

      if (
        editForm.experience ===
          "" ||
        Number(
          editForm.experience
        ) < 0
      ) {
        setError(
          "Please enter valid experience."
        );
        return;
      }

      if (
        editForm.consultationFee ===
          "" ||
        Number(
          editForm.consultationFee
        ) < 0
      ) {
        setError(
          "Please enter a valid consultation fee."
        );
        return;
      }

      try {
        setSubmitting(true);

        const payload = {
          name:
            editForm.name.trim(),

          email:
            editForm.email.trim(),

          phone:
            editForm.phone.trim(),

          specialization:
            editForm.specialization.trim(),

          qualification:
            editForm.qualification.trim(),

          licenseNumber:
            editForm.licenseNumber.trim(),

          experience:
            Number(
              editForm.experience
            ),

          consultationFee:
            Number(
              editForm.consultationFee
            ),

          availableDays:
            editForm.availableDays,

          availability: {
            startTime:
              editForm.startTime,

            endTime:
              editForm.endTime,
          },

          department:
            editForm.department.trim(),

          bio:
            editForm.bio.trim(),
        };

        const response =
          await axios.put(
            `${API_URL}/doctors/${selectedDoctor._id}`,
            payload,
            getAuthConfig()
          );

        setSuccess(
          response.data?.message ||
            "Doctor updated successfully."
        );

        setShowEditModal(false);

        setSelectedDoctor(null);

        setEditForm({
          ...initialForm,
        });

        await fetchDoctors();
      } catch (err) {
        console.error(
          "Update doctor error:",
          err
        );

        if (
          err.response?.status ===
          401
        ) {
          localStorage.removeItem(
            "clinic_token"
          );

          localStorage.removeItem(
            "clinic_user"
          );

          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to update doctor. Please try again."
        );
      } finally {
        setSubmitting(false);
      }
    };

  // ======================================================
  // DEACTIVATE / REACTIVATE
  // ======================================================

  const handleToggleStatus =
    async (doctor) => {
      if (!doctor?._id) {
        return;
      }

      const isInactive =
        doctor.isActive === false;

      const actionKey = `${doctor._id}-${isInactive ? "restore" : "deactivate"}`;

      try {
        setActionLoading(
          actionKey
        );

        setError("");
        setSuccess("");

        let response;

        if (isInactive) {
          response =
            await axios.patch(
              `${API_URL}/doctors/${doctor._id}/restore`,
              {},
              getAuthConfig()
            );
        } else {
          response =
            await axios.delete(
              `${API_URL}/doctors/${doctor._id}`,
              getAuthConfig()
            );
        }

        setSuccess(
          response.data?.message ||
            (isInactive
              ? "Doctor reactivated successfully."
              : "Doctor deactivated successfully.")
        );

        await fetchDoctors();
      } catch (err) {
        console.error(
          "Doctor status update error:",
          err
        );

        if (
          err.response?.status ===
          401
        ) {
          localStorage.removeItem(
            "clinic_token"
          );

          localStorage.removeItem(
            "clinic_user"
          );

          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to change doctor status."
        );
      } finally {
        setActionLoading("");
      }
    };

  // ======================================================
  // HELPERS
  // ======================================================

  const getDoctorName = (
    doctor
  ) =>
    doctor?.user?.name ||
    "Unknown Doctor";

  const getDoctorEmail = (
    doctor
  ) =>
    doctor?.user?.email ||
    "No email";

  const getDoctorPhone = (
    doctor
  ) =>
    doctor?.user?.phone ||
    "No phone";

  const formatDays = (
    availableDays = []
  ) => {
    if (
      !Array.isArray(
        availableDays
      ) ||
      !availableDays.length
    ) {
      return "Not specified";
    }

    return availableDays
      .map((day) => {
        const found =
          days.find(
            (item) =>
              item.value === day
          );

        return found
          ? found.label
          : day;
      })
      .join(", ");
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="page-container">

      {/* ================= HEADER ================= */}

      <div className="page-header">
        <div>
          <div className="page-breadcrumb">
            <span>Clinic</span>
            <span>/</span>
            <span>Doctors</span>
          </div>

          <h1>Doctors</h1>

          <p>
            Manage doctors, specializations,
            availability and consultation details.
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

      {/* ================= SUCCESS ================= */}

      {success && (
        <div className="alert success-alert">
          <Check size={18} />

          <span>
            {success}
          </span>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ================= ERROR ================= */}

      {error &&
        !showAddModal &&
        !showEditModal && (
          <div className="alert error-alert">
            <Activity size={18} />

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              <X size={16} />
            </button>
          </div>
        )}

      {/* ================= STATS ================= */}

      <div className="stats-grid doctor-stats">

        <div className="stat-card">
          <div className="stat-icon">
            <Stethoscope
              size={21}
            />
          </div>

          <div>
            <span className="stat-label">
              Total Doctors
            </span>

            <strong>
              {doctors.length}
            </strong>
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

            <strong>
              {activeDoctors}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Power size={21} />
          </div>

          <div>
            <span className="stat-label">
              Inactive Doctors
            </span>

            <strong>
              {inactiveDoctors}
            </strong>
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

            <strong>
              ₹{averageFee}
            </strong>
          </div>
        </div>
      </div>

      {/* ================= DIRECTORY ================= */}

      <div className="content-card">

        <div className="content-card-header">

          <div>
            <h2>
              Doctor Directory
            </h2>

            <p>
              {filteredDoctors.length} doctor
              {filteredDoctors.length !== 1
                ? "s"
                : ""}{" "}
              found
            </p>
          </div>

          <div className="search-box">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search doctors..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />
          </div>

        </div>

        {/* ================= LOADING ================= */}

        {loading ? (
          <div className="empty-state">

            <div className="loading-spinner"></div>

            <h3>
              Loading doctors...
            </h3>

            <p>
              Please wait while we fetch doctor data.
            </p>

          </div>
        ) : filteredDoctors.length ===
          0 ? (

          /* ================= EMPTY ================= */

          <div className="empty-state">

            <div className="empty-icon">
              <Stethoscope
                size={30}
              />
            </div>

            <h3>
              No doctors found
            </h3>

            <p>
              {searchTerm
                ? "Try changing your search term."
                : "Add your first doctor to get started."}
            </p>

            {!searchTerm && (
              <button
                className="primary-button"
                onClick={
                  openAddModal
                }
              >
                <Plus size={18} />
                Add Doctor
              </button>
            )}

          </div>

        ) : (

          /* ================= DOCTOR GRID ================= */

          <div className="doctor-grid">

            {filteredDoctors.map(
              (doctor) => {

                const isInactive =
                  doctor.isActive ===
                  false;

                const deactivateKey =
                  `${doctor._id}-deactivate`;

                const restoreKey =
                  `${doctor._id}-restore`;

                const currentActionKey =
                  isInactive
                    ? restoreKey
                    : deactivateKey;

                const isActionLoading =
                  actionLoading ===
                  currentActionKey;

                return (
                  <div
                    className="doctor-card"
                    key={doctor._id}
                  >

                    {/* CARD TOP */}

                    <div className="doctor-card-top">

                      <div className="doctor-avatar">
                        <UserRound
                          size={25}
                        />
                      </div>

                      <span
                        className={`status-badge ${
                          isInactive
                            ? "inactive"
                            : "active"
                        }`}
                      >
                        {isInactive
                          ? "Inactive"
                          : "Active"}
                      </span>

                    </div>

                    {/* CARD BODY */}

                    <div className="doctor-card-body">

                      <h3>
                        {getDoctorName(
                          doctor
                        )}
                      </h3>

                      <div className="doctor-specialization">

                        <Stethoscope
                          size={16}
                        />

                        <span>
                          {doctor.specialization ||
                            "Specialization not specified"}
                        </span>

                      </div>

                      <div className="doctor-info-row">

                        <Mail
                          size={15}
                        />

                        <span>
                          {getDoctorEmail(
                            doctor
                          )}
                        </span>

                      </div>

                      <div className="doctor-info-row">

                        <Phone
                          size={15}
                        />

                        <span>
                          {getDoctorPhone(
                            doctor
                          )}
                        </span>

                      </div>

                      <div className="doctor-meta">

                        <div>
                          <span>
                            Experience
                          </span>

                          <strong>
                            {doctor.experience ||
                              0}{" "}
                            years
                          </strong>
                        </div>

                        <div>
                          <span>
                            Consultation
                          </span>

                          <strong>
                            ₹
                            {doctor.consultationFee ||
                              0}
                          </strong>
                        </div>

                      </div>

                    </div>

                    {/* CARD ACTIONS */}

                    <div className="doctor-card-footer">

                      <button
                        className="secondary-button"
                        onClick={() =>
                          openViewModal(
                            doctor
                          )
                        }
                        title="View Details"
                      >
                        <Eye
                          size={17}
                        />

                        View
                      </button>

                      <button
                        className="secondary-button"
                        onClick={() =>
                          openEditModal(
                            doctor
                          )
                        }
                        title="Edit Doctor"
                      >
                        <Pencil
                          size={17}
                        />

                        Edit
                      </button>

                      <button
                        className={`secondary-button ${
                          isInactive
                            ? "restore-button"
                            : "danger-button"
                        }`}
                        onClick={() =>
                          handleToggleStatus(
                            doctor
                          )
                        }
                        disabled={
                          isActionLoading
                        }
                        title={
                          isInactive
                            ? "Reactivate Doctor"
                            : "Deactivate Doctor"
                        }
                      >
                        {isActionLoading ? (
                          <span className="button-spinner"></span>
                        ) : isInactive ? (
                          <RotateCcw
                            size={17}
                          />
                        ) : (
                          <Power
                            size={17}
                          />
                        )}

                        {isInactive
                          ? "Activate"
                          : "Deactivate"}
                      </button>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

      {/* ==================================================
          ADD DOCTOR MODAL
      ================================================== */}

      {showAddModal && (
        <div
          className="modal-overlay"
          onMouseDown={
            closeAddModal
          }
        >

          <div
            className="modal large-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <h2>
                  Add New Doctor
                </h2>

                <p>
                  Enter the doctor's professional
                  and availability details.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={
                  closeAddModal
                }
                type="button"
              >
                <X size={20} />
              </button>

            </div>

            {error && (
              <div className="alert error-alert modal-alert">

                <Activity
                  size={18}
                />

                <span>
                  {error}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setError("")
                  }
                >
                  <X size={16} />
                </button>

              </div>
            )}

            <form
              className="doctor-form"
              onSubmit={
                handleSubmit
              }
            >

              {/* BASIC INFORMATION */}

              <div className="form-section">

                <div className="form-section-title">

                  <UserRound
                    size={18}
                  />

                  <span>
                    Basic Information
                  </span>

                </div>

                <div className="form-grid">

                  <div className="form-group">
                    <label>
                      Full Name{" "}
                      <span>*</span>
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={
                        form.name
                      }
                      onChange={
                        handleInputChange
                      }
                      placeholder="Dr. John Doe"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Email{" "}
                      <span>*</span>
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={
                        form.email
                      }
                      onChange={
                        handleInputChange
                      }
                      placeholder="doctor@clinic.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Phone
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={
                        form.phone
                      }
                      onChange={
                        handleInputChange
                      }
                      placeholder="9876543210"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Password{" "}
                      <span>*</span>
                    </label>

                    <input
                      type="password"
                      name="password"
                      value={
                        form.password
                      }
                      onChange={
                        handleInputChange
                      }
                      placeholder="Minimum 6 characters"
                      required
                    />
                  </div>

                </div>

              </div>

              {/* PROFESSIONAL INFORMATION */}

              <div className="form-section">

                <div className="form-section-title">

                  <Stethoscope
                    size={18}
                  />

                  <span>
                    Professional Information
                  </span>

                </div>

                <div className="form-grid">

                  <div className="form-group">
                    <label>
                      Specialization{" "}
                      <span>*</span>
                    </label>

                    <input
                      type="text"
                      name="specialization"
                      value={
                        form.specialization
                      }
                      onChange={
                        handleInputChange
                      }
                      placeholder="Cardiology"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Qualification{" "}
                      <span>*</span>
                    </label>

                    <input
                      type="text"
                      name="qualification"
                      value={
                        form.qualification
                      }
                      onChange={
                        handleInputChange
                      }
                      placeholder="MBBS, MD"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Medical License Number{" "}
                      <span>*</span>
                    </label>

                    <input
                      type="text"
                      name="licenseNumber"
                      value={
                        form.licenseNumber
                      }
                      onChange={
                        handleInputChange
                      }
                      placeholder="MED-2026-0003"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Experience (Years){" "}
                      <span>*</span>
                    </label>

                    <input
                      type="number"
                      name="experience"
                      value={
                        form.experience
                      }
                      onChange={
                        handleInputChange
                      }
                      placeholder="5"
                      min="0"
                      max="70"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Consultation Fee (₹){" "}
                      <span>*</span>
                    </label>

                    <input
                      type="number"
                      name="consultationFee"
                      value={
                        form.consultationFee
                      }
                      onChange={
                        handleInputChange
                      }
                      placeholder="500"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Department
                    </label>

                    <input
                      type="text"
                      name="department"
                      value={
                        form.department
                      }
                      onChange={
                        handleInputChange
                      }
                      placeholder="General Medicine"
                    />
                  </div>

                </div>

              </div>

              {/* AVAILABILITY */}

              <div className="form-section">

                <div className="form-section-title">

                  <CalendarDays
                    size={18}
                  />

                  <span>
                    Availability
                  </span>

                </div>

                <div className="form-group full-width">

                  <label>
                    Available Days
                  </label>

                  <div className="days-selector">

                    {days.map(
                      (day) => {

                        const selected =
                          form.availableDays.includes(
                            day.value
                          );

                        return (
                          <button
                            key={
                              day.value
                            }
                            type="button"
                            className={`day-button ${
                              selected
                                ? "selected"
                                : ""
                            }`}
                            onClick={() =>
                              handleDayToggle(
                                day.value
                              )
                            }
                          >

                            {selected && (
                              <Check
                                size={
                                  14
                                }
                              />
                            )}

                            {
                              day.label
                            }

                          </button>
                        );
                      }
                    )}

                  </div>

                </div>

                <div className="form-grid">

                  <div className="form-group">

                    <label>
                      <Clock3
                        size={15}
                      />
                      Start Time
                    </label>

                    <input
                      type="time"
                      name="startTime"
                      value={
                        form.startTime
                      }
                      onChange={
                        handleInputChange
                      }
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      <Clock3
                        size={15}
                      />
                      End Time
                    </label>

                    <input
                      type="time"
                      name="endTime"
                      value={
                        form.endTime
                      }
                      onChange={
                        handleInputChange
                      }
                    />

                  </div>

                </div>

              </div>

              {/* BIO */}

              <div className="form-section">

                <div className="form-section-title">

                  <FileText
                    size={18}
                  />

                  <span>
                    Doctor Profile
                  </span>

                </div>

                <div className="form-group full-width">

                  <label>
                    Bio
                  </label>

                  <textarea
                    name="bio"
                    value={
                      form.bio
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Short professional description..."
                    rows="4"
                  />

                </div>

              </div>

              {/* FOOTER */}

              <div className="modal-footer">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    closeAddModal
                  }
                  disabled={
                    submitting
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    submitting
                  }
                >

                  {submitting ? (
                    <>
                      <span className="button-spinner"></span>
                      Adding Doctor...
                    </>
                  ) : (
                    <>
                      <Plus
                        size={18}
                      />
                      Add Doctor
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ==================================================
          EDIT DOCTOR MODAL
      ================================================== */}

      {showEditModal &&
        selectedDoctor && (
          <div
            className="modal-overlay"
            onMouseDown={
              closeEditModal
            }
          >

            <div
              className="modal large-modal"
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
            >

              <div className="modal-header">

                <div>
                  <h2>
                    Edit Doctor
                  </h2>

                  <p>
                    Update professional and
                    account information.
                  </p>
                </div>

                <button
                  className="modal-close"
                  onClick={
                    closeEditModal
                  }
                  type="button"
                >
                  <X size={20} />
                </button>

              </div>

              {error && (
                <div className="alert error-alert modal-alert">

                  <Activity
                    size={18}
                  />

                  <span>
                    {error}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setError("")
                    }
                  >
                    <X size={16} />
                  </button>

                </div>
              )}

              <form
                className="doctor-form"
                onSubmit={
                  handleUpdateDoctor
                }
              >

                {/* ACCOUNT */}

                <div className="form-section">

                  <div className="form-section-title">

                    <UserRound
                      size={18}
                    />

                    <span>
                      Account Information
                    </span>

                  </div>

                  <div className="form-grid">

                    <div className="form-group">

                      <label>
                        Full Name{" "}
                        <span>*</span>
                      </label>

                      <input
                        type="text"
                        name="name"
                        value={
                          editForm.name
                        }
                        onChange={
                          handleEditInputChange
                        }
                        required
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Email{" "}
                        <span>*</span>
                      </label>

                      <input
                        type="email"
                        name="email"
                        value={
                          editForm.email
                        }
                        onChange={
                          handleEditInputChange
                        }
                        required
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Phone
                      </label>

                      <input
                        type="tel"
                        name="phone"
                        value={
                          editForm.phone
                        }
                        onChange={
                          handleEditInputChange
                        }
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Account Status
                      </label>

                      <div className="form-status-display">

                        <span
                          className={`status-badge ${
                            selectedDoctor.isActive ===
                            false
                              ? "inactive"
                              : "active"
                          }`}
                        >
                          {selectedDoctor.isActive ===
                          false
                            ? "Inactive"
                            : "Active"}
                        </span>

                      </div>

                    </div>

                  </div>

                </div>

                {/* PROFESSIONAL */}

                <div className="form-section">

                  <div className="form-section-title">

                    <Stethoscope
                      size={18}
                    />

                    <span>
                      Professional Information
                    </span>

                  </div>

                  <div className="form-grid">

                    <div className="form-group">

                      <label>
                        Specialization{" "}
                        <span>*</span>
                      </label>

                      <input
                        type="text"
                        name="specialization"
                        value={
                          editForm.specialization
                        }
                        onChange={
                          handleEditInputChange
                        }
                        required
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Qualification{" "}
                        <span>*</span>
                      </label>

                      <input
                        type="text"
                        name="qualification"
                        value={
                          editForm.qualification
                        }
                        onChange={
                          handleEditInputChange
                        }
                        required
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Medical License Number{" "}
                        <span>*</span>
                      </label>

                      <input
                        type="text"
                        name="licenseNumber"
                        value={
                          editForm.licenseNumber
                        }
                        onChange={
                          handleEditInputChange
                        }
                        required
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Experience (Years){" "}
                        <span>*</span>
                      </label>

                      <input
                        type="number"
                        name="experience"
                        value={
                          editForm.experience
                        }
                        onChange={
                          handleEditInputChange
                        }
                        min="0"
                        max="70"
                        required
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Consultation Fee (₹){" "}
                        <span>*</span>
                      </label>

                      <input
                        type="number"
                        name="consultationFee"
                        value={
                          editForm.consultationFee
                        }
                        onChange={
                          handleEditInputChange
                        }
                        min="0"
                        required
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Department
                      </label>

                      <input
                        type="text"
                        name="department"
                        value={
                          editForm.department
                        }
                        onChange={
                          handleEditInputChange
                        }
                      />

                    </div>

                  </div>

                </div>

                {/* AVAILABILITY */}

                <div className="form-section">

                  <div className="form-section-title">

                    <CalendarDays
                      size={18}
                    />

                    <span>
                      Availability
                    </span>

                  </div>

                  <div className="form-group full-width">

                    <label>
                      Available Days
                    </label>

                    <div className="days-selector">

                      {days.map(
                        (day) => {

                          const selected =
                            editForm.availableDays.includes(
                              day.value
                            );

                          return (
                            <button
                              key={
                                day.value
                              }
                              type="button"
                              className={`day-button ${
                                selected
                                  ? "selected"
                                  : ""
                              }`}
                              onClick={() =>
                                handleEditDayToggle(
                                  day.value
                                )
                              }
                            >

                              {selected && (
                                <Check
                                  size={
                                    14
                                  }
                                />
                              )}

                              {
                                day.label
                              }

                            </button>
                          );
                        }
                      )}

                    </div>

                  </div>

                  <div className="form-grid">

                    <div className="form-group">

                      <label>
                        <Clock3
                          size={15}
                        />
                        Start Time
                      </label>

                      <input
                        type="time"
                        name="startTime"
                        value={
                          editForm.startTime
                        }
                        onChange={
                          handleEditInputChange
                        }
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        <Clock3
                          size={15}
                        />
                        End Time
                      </label>

                      <input
                        type="time"
                        name="endTime"
                        value={
                          editForm.endTime
                        }
                        onChange={
                          handleEditInputChange
                        }
                      />

                    </div>

                  </div>

                </div>

                {/* BIO */}

                <div className="form-section">

                  <div className="form-section-title">

                    <FileText
                      size={18}
                    />

                    <span>
                      Doctor Profile
                    </span>

                  </div>

                  <div className="form-group full-width">

                    <label>
                      Bio
                    </label>

                    <textarea
                      name="bio"
                      value={
                        editForm.bio
                      }
                      onChange={
                        handleEditInputChange
                      }
                      placeholder="Short professional description..."
                      rows="4"
                    />

                  </div>

                </div>

                {/* FOOTER */}

                <div className="modal-footer">

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={
                      closeEditModal
                    }
                    disabled={
                      submitting
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      submitting
                    }
                  >

                    {submitting ? (
                      <>
                        <span className="button-spinner"></span>
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Check
                          size={18}
                        />
                        Save Changes
                      </>
                    )}

                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

      {/* ==================================================
          VIEW DETAILS MODAL
      ================================================== */}

      {showViewModal &&
        selectedDoctor && (
          <div
            className="modal-overlay"
            onMouseDown={
              closeViewModal
            }
          >

            <div
              className="modal doctor-view-modal"
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
            >

              <div className="modal-header">

                <div>
                  <h2>
                    Doctor Details
                  </h2>

                  <p>
                    Complete professional information
                  </p>
                </div>

                <button
                  className="modal-close"
                  onClick={
                    closeViewModal
                  }
                  type="button"
                >
                  <X size={20} />
                </button>

              </div>

              {/* PROFILE HEADER */}

              <div className="doctor-profile-header">

                <div className="doctor-profile-avatar">
                  <Stethoscope
                    size={32}
                  />
                </div>

                <div>

                  <h3>
                    {getDoctorName(
                      selectedDoctor
                    )}
                  </h3>

                  <p>
                    {selectedDoctor.specialization ||
                      "Specialization not specified"}
                  </p>

                  <span
                    className={`status-badge ${
                      selectedDoctor.isActive ===
                      false
                        ? "inactive"
                        : "active"
                    }`}
                  >
                    {selectedDoctor.isActive ===
                    false
                      ? "Inactive"
                      : "Active"}
                  </span>

                </div>

              </div>

              {/* DETAILS */}

              <div className="detail-grid">

                <div className="detail-item">

                  <span className="detail-label">
                    <Mail
                      size={15}
                    />
                    Email
                  </span>

                  <strong>
                    {getDoctorEmail(
                      selectedDoctor
                    )}
                  </strong>

                </div>

                <div className="detail-item">

                  <span className="detail-label">
                    <Phone
                      size={15}
                    />
                    Phone
                  </span>

                  <strong>
                    {getDoctorPhone(
                      selectedDoctor
                    )}
                  </strong>

                </div>

                <div className="detail-item">

                  <span className="detail-label">
                    <BriefcaseMedical
                      size={15}
                    />
                    Qualification
                  </span>

                  <strong>
                    {selectedDoctor.qualification ||
                      "Not specified"}
                  </strong>

                </div>

                <div className="detail-item">

                  <span className="detail-label">
                    <FileText
                      size={15}
                    />
                    License Number
                  </span>

                  <strong>
                    {selectedDoctor.licenseNumber ||
                      "Not specified"}
                  </strong>

                </div>

                <div className="detail-item">

                  <span className="detail-label">
                    <Activity
                      size={15}
                    />
                    Experience
                  </span>

                  <strong>
                    {selectedDoctor.experience ||
                      0}{" "}
                    years
                  </strong>

                </div>

                <div className="detail-item">

                  <span className="detail-label">
                    <FileText
                      size={15}
                    />
                    Consultation Fee
                  </span>

                  <strong>
                    ₹
                    {selectedDoctor.consultationFee ||
                      0}
                  </strong>

                </div>

                <div className="detail-item">

                  <span className="detail-label">
                    <BriefcaseMedical
                      size={15}
                    />
                    Department
                  </span>

                  <strong>
                    {selectedDoctor.department ||
                      "Not specified"}
                  </strong>

                </div>

                <div className="detail-item">

                  <span className="detail-label">
                    <CalendarDays
                      size={15}
                    />
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
                    <Clock3
                      size={15}
                    />
                    Availability
                  </span>

                  <strong>
                    {selectedDoctor
                      .availability
                      ?.startTime &&
                    selectedDoctor
                      .availability
                      ?.endTime
                      ? `${selectedDoctor.availability.startTime} - ${selectedDoctor.availability.endTime}`
                      : "Not specified"}
                  </strong>

                </div>

              </div>

              {/* BIO */}

              {selectedDoctor.bio && (
                <div className="doctor-bio">

                  <span className="detail-label">

                    <FileText
                      size={15}
                    />

                    Professional Bio

                  </span>

                  <p>
                    {
                      selectedDoctor.bio
                    }
                  </p>

                </div>
              )}

              {/* FOOTER */}

              <div className="modal-footer">

                <button
                  className="secondary-button"
                  onClick={
                    closeViewModal
                  }
                >
                  Close
                </button>

                <button
                  className="primary-button"
                  onClick={() => {
                    closeViewModal();
                    openEditModal(
                      selectedDoctor
                    );
                  }}
                >
                  <Pencil
                    size={17}
                  />
                  Edit Doctor
                </button>

              </div>

            </div>

          </div>
        )}

    </div>
  );
};

export default Doctors;