require("dotenv").config();

const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const app = require("../app");
const connectDB = require("../config/db");

const User = require("../models/user");
const Patient = require("../models/patient");
const Doctor = require("../models/doctor");
const Appointment = require("../models/appointment");
const MedicalRecord = require("../models/medicalRecord");

describe("Medical Records API - Integration Tests", () => {
  let adminUser;
  let doctorUser;
  let receptionistUser;

  let patient;
  let doctor;

  let appointment;
  let secondAppointment;
  let medicalRecord;

  let adminToken;
  let doctorToken;
  let receptionistToken;

  beforeAll(async () => {
    await connectDB();

    adminUser = await User.create({
      name: "EMR Test Admin",
      email: `emr_admin_${Date.now()}@clinic.com`,
      phone: "9000000001",
      password: "Admin@12345",
      role: "admin",
    });

    doctorUser = await User.create({
      name: "EMR Test Doctor",
      email: `emr_doctor_${Date.now()}@clinic.com`,
      phone: "9000000002",
      password: "Doctor@12345",
      role: "doctor",
    });

    receptionistUser = await User.create({
      name: "EMR Test Receptionist",
      email: `emr_receptionist_${Date.now()}@clinic.com`,
      phone: "9000000003",
      password: "Reception@12345",
      role: "receptionist",
    });

    doctor = await Doctor.create({
      user: doctorUser._id,
      specialization: "General Medicine",
      qualification: "MBBS",
      licenseNumber: `EMR-LIC-${Date.now()}`,
      experience: 5,
      consultationFee: 800,
      availableDays: ["monday", "tuesday", "wednesday"],
      availability: {
        startTime: "09:00",
        endTime: "17:00",
      },
      department: "General Medicine",
      bio: "EMR integration test doctor",
    });

    patient = await Patient.create({
      name: "EMR Test Patient",
      dateOfBirth: "2000-05-15",
      gender: "male",
      phone: "9000000010",
      email: `emr_patient_${Date.now()}@clinic.com`,
      address: "Test Address",
      bloodGroup: "O+",
      medicalHistory: "No major medical history",
      allergies: ["None"],
      notes: "EMR integration test patient",
      createdBy: adminUser._id,
    });

    adminToken = jwt.sign(
      { userId: adminUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    doctorToken = jwt.sign(
      { userId: doctorUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    receptionistToken = jwt.sign(
      { userId: receptionistUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      appointmentDate: new Date("2035-07-10"),
      appointmentTime: "10:00",
      reason: "Fever and weakness",
      consultationFee: 800,
      notes: "EMR primary test appointment",
      createdBy: adminUser._id,
    });

    secondAppointment = await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      appointmentDate: new Date("2035-07-11"),
      appointmentTime: "11:00",
      reason: "Headache",
      consultationFee: 800,
      notes: "EMR secondary test appointment",
      createdBy: adminUser._id,
    });
  });

  afterAll(async () => {
    if (medicalRecord?._id) {
      await MedicalRecord.findByIdAndDelete(medicalRecord._id);
    }

    if (appointment?._id) {
      await Appointment.findByIdAndDelete(appointment._id);
    }

    if (secondAppointment?._id) {
      await Appointment.findByIdAndDelete(secondAppointment._id);
    }

    if (patient?._id) {
      await Patient.findByIdAndDelete(patient._id);
    }

    if (doctor?._id) {
      await Doctor.findByIdAndDelete(doctor._id);
    }

    if (adminUser?._id) {
      await User.findByIdAndDelete(adminUser._id);
    }

    if (doctorUser?._id) {
      await User.findByIdAndDelete(doctorUser._id);
    }

    if (receptionistUser?._id) {
      await User.findByIdAndDelete(receptionistUser._id);
    }

    await mongoose.connection.close();
  });

  describe("POST /api/medical-records", () => {
    test("should reject request without authentication", async () => {
      const response = await request(app)
        .post("/api/medical-records")
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: appointment._id,
          chiefComplaint: "Fever",
          diagnosis: "Viral fever",
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should reject medical record creation for receptionist", async () => {
      const response = await request(app)
        .post("/api/medical-records")
        .set("Authorization", `Bearer ${receptionistToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: appointment._id,
          chiefComplaint: "Fever",
          diagnosis: "Viral fever",
        });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should reject request with missing required fields", async () => {
      const response = await request(app)
        .post("/api/medical-records")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: appointment._id,
          chiefComplaint: "Fever",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should reject creation for an invalid patient", async () => {
      const fakePatientId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post("/api/medical-records")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: fakePatientId,
          doctor: doctor._id,
          appointment: appointment._id,
          chiefComplaint: "Fever",
          diagnosis: "Viral fever",
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Active patient not found");
    });

    test("should reject creation for an invalid doctor", async () => {
      const fakeDoctorId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post("/api/medical-records")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patient._id,
          doctor: fakeDoctorId,
          appointment: appointment._id,
          chiefComplaint: "Fever",
          diagnosis: "Viral fever",
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Active doctor not found");
    });

    test("should reject creation for an invalid appointment", async () => {
      const fakeAppointmentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post("/api/medical-records")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: fakeAppointmentId,
          chiefComplaint: "Fever",
          diagnosis: "Viral fever",
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Appointment not found");
    });

    test("should reject appointment belonging to a different patient or doctor", async () => {
      const anotherPatient = await Patient.create({
        name: "EMR Another Patient",
        dateOfBirth: "1998-03-10",
        gender: "female",
        phone: "9000000020",
        email: `emr_another_patient_${Date.now()}@clinic.com`,
        bloodGroup: "A+",
        createdBy: adminUser._id,
      });

      const response = await request(app)
        .post("/api/medical-records")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: anotherPatient._id,
          doctor: doctor._id,
          appointment: appointment._id,
          chiefComplaint: "Fever",
          diagnosis: "Viral fever",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Appointment does not belong to the selected patient and doctor"
      );

      await Patient.findByIdAndDelete(anotherPatient._id);
    });

    test("should create a medical record successfully as admin", async () => {
      const response = await request(app)
        .post("/api/medical-records")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: appointment._id,
          visitDate: "2035-07-10",
          chiefComplaint: "Fever and weakness",
          symptoms: ["Fever", "Weakness", "Body ache"],
          vitals: {
            temperature: 101.2,
            bloodPressure: "120/80",
            heartRate: 88,
            respiratoryRate: 18,
            oxygenSaturation: 98,
            weight: 68,
            height: 172,
          },
          diagnosis: "Viral fever",
          treatmentPlan: "Rest, hydration and symptomatic treatment",
          clinicalNotes: "Patient advised to monitor temperature.",
          followUpDate: "2035-07-17",
          followUpNotes: "Follow up after one week",
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.medicalRecord).toBeDefined();

      medicalRecord = response.body.data.medicalRecord;

      expect(medicalRecord.patient._id).toBe(patient._id.toString());
      expect(medicalRecord.doctor._id).toBe(doctor._id.toString());
      expect(medicalRecord.appointment._id).toBe(
        appointment._id.toString()
      );
      expect(medicalRecord.chiefComplaint).toBe("Fever and weakness");
      expect(medicalRecord.diagnosis).toBe("Viral fever");

      const updatedAppointment = await Appointment.findById(
        appointment._id
      );

      expect(updatedAppointment.status).toBe("completed");
    });

    test("should reject duplicate medical record for the same appointment", async () => {
      const response = await request(app)
        .post("/api/medical-records")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: appointment._id,
          chiefComplaint: "Duplicate record",
          diagnosis: "Duplicate diagnosis",
        });

      expect(response.statusCode).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "A medical record already exists for this appointment"
      );
    });

    test("should create a medical record successfully as doctor", async () => {
      const response = await request(app)
        .post("/api/medical-records")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: secondAppointment._id,
          visitDate: "2035-07-11",
          chiefComplaint: "Headache",
          symptoms: ["Headache"],
          vitals: {
            temperature: 98.6,
            bloodPressure: "118/78",
            heartRate: 76,
          },
          diagnosis: "Tension headache",
          treatmentPlan: "Rest and adequate hydration",
          clinicalNotes: "No serious symptoms observed",
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.medicalRecord).toBeDefined();

      const createdRecordId =
        response.body.data.medicalRecord._id;

      const createdRecord = await MedicalRecord.findById(
        createdRecordId
      );

      expect(createdRecord).toBeDefined();
      expect(createdRecord.diagnosis).toBe("Tension headache");

      const updatedAppointment = await Appointment.findById(
        secondAppointment._id
      );

      expect(updatedAppointment.status).toBe("completed");

      await MedicalRecord.findByIdAndDelete(createdRecordId);
    });
  });

  describe("GET /api/medical-records", () => {
    test("should reject request without authentication", async () => {
      const response = await request(app).get(
        "/api/medical-records"
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should allow admin to retrieve medical records", async () => {
      const response = await request(app)
        .get("/api/medical-records")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.medicalRecords).toBeDefined();
      expect(Array.isArray(response.body.data.medicalRecords)).toBe(
        true
      );
      expect(response.body.count).toBeGreaterThanOrEqual(1);
    });

    test("should allow doctor to retrieve medical records", async () => {
      const response = await request(app)
        .get("/api/medical-records")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.medicalRecords).toBeDefined();
    });

    test("should allow receptionist to retrieve medical records", async () => {
      const response = await request(app)
        .get("/api/medical-records")
        .set("Authorization", `Bearer ${receptionistToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.medicalRecords).toBeDefined();
    });
  });

  describe("GET /api/medical-records/:id", () => {
    test("should retrieve a medical record by ID", async () => {
      const response = await request(app)
        .get(`/api/medical-records/${medicalRecord._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.medicalRecord).toBeDefined();
      expect(
        response.body.data.medicalRecord._id
      ).toBe(medicalRecord._id.toString());
    });

    test("should return 404 for a non-existing medical record", async () => {
      const fakeRecordId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/medical-records/${fakeRecordId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Medical record not found");
    });

    test("should allow receptionist to retrieve a medical record", async () => {
      const response = await request(app)
        .get(`/api/medical-records/${medicalRecord._id}`)
        .set("Authorization", `Bearer ${receptionistToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.medicalRecord).toBeDefined();
    });
  });

  describe("GET /api/medical-records/patient/:patientId", () => {
    test("should reject request without authentication", async () => {
      const response = await request(app).get(
        `/api/medical-records/patient/${patient._id}`
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should retrieve patient medical history successfully", async () => {
      const response = await request(app)
        .get(`/api/medical-records/patient/${patient._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.patient).toBeDefined();
      expect(response.body.data.medicalRecords).toBeDefined();
      expect(Array.isArray(response.body.data.medicalRecords)).toBe(
        true
      );

      expect(response.body.data.patient.name).toBe(
        "EMR Test Patient"
      );
      expect(response.body.count).toBeGreaterThanOrEqual(1);
    });

    test("should return 404 for a non-existing patient", async () => {
      const fakePatientId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/medical-records/patient/${fakePatientId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Active patient not found"
      );
    });

    test("should allow receptionist to view patient medical history", async () => {
      const response = await request(app)
        .get(`/api/medical-records/patient/${patient._id}`)
        .set("Authorization", `Bearer ${receptionistToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.medicalRecords).toBeDefined();
    });
  });

  describe("PUT /api/medical-records/:id", () => {
    test("should reject update without authentication", async () => {
      const response = await request(app)
        .put(`/api/medical-records/${medicalRecord._id}`)
        .send({
          diagnosis: "Updated diagnosis",
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should reject medical record update for receptionist", async () => {
      const response = await request(app)
        .put(`/api/medical-records/${medicalRecord._id}`)
        .set("Authorization", `Bearer ${receptionistToken}`)
        .send({
          diagnosis: "Updated diagnosis",
        });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should update medical record successfully as doctor", async () => {
      const response = await request(app)
        .put(`/api/medical-records/${medicalRecord._id}`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          diagnosis: "Updated viral fever",
          treatmentPlan: "Updated treatment plan",
          clinicalNotes: "Updated clinical notes",
          followUpNotes: "Updated follow-up notes",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.medicalRecord).toBeDefined();

      expect(
        response.body.data.medicalRecord.diagnosis
      ).toBe("Updated viral fever");

      expect(
        response.body.data.medicalRecord.treatmentPlan
      ).toBe("Updated treatment plan");
    });

    test("should update medical record successfully as admin", async () => {
      const response = await request(app)
        .put(`/api/medical-records/${medicalRecord._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          diagnosis: "Final updated diagnosis",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.medicalRecord).toBeDefined();

      expect(
        response.body.data.medicalRecord.diagnosis
      ).toBe("Final updated diagnosis");
    });

    test("should return 404 when updating a non-existing medical record", async () => {
      const fakeRecordId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/medical-records/${fakeRecordId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          diagnosis: "Does not exist",
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Medical record not found");
    });
  });
});