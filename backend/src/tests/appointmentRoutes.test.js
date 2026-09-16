require("dotenv").config();

const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../app");
const connectDB = require("../config/db");

const User = require("../models/user");
const Patient = require("../models/patient");
const Doctor = require("../models/doctor");
const Appointment = require("../models/appointment");

describe("Appointment API - Integration Tests", () => {
  let adminToken;
  let doctorToken;
  let patientId;
  let doctorId;
  let appointmentId;

  beforeAll(async () => {
    await connectDB();

    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: "testadmin@clinic.com",
        password: "Test@123456",
      });

    const doctorLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: "testdoctor@clinic.com",
        password: "Doctor@12345",
      });

    expect(adminLogin.statusCode).toBe(200);
    expect(doctorLogin.statusCode).toBe(200);

    adminToken = adminLogin.body.data.token;
    doctorToken = doctorLogin.body.data.token;

    const patient = await Patient.findOne({
      isActive: true,
    }).sort({ createdAt: -1 });

    const doctor = await Doctor.findOne({
      isActive: true,
    }).sort({ createdAt: -1 });

    if (!patient) {
      throw new Error(
        "No active patient found. Please create a patient first."
      );
    }

    if (!doctor) {
      throw new Error(
        "No active doctor found. Please create a doctor first."
      );
    }

    patientId = patient._id.toString();
    doctorId = doctor._id.toString();
  });

  afterAll(async () => {
    if (appointmentId) {
      await Appointment.findByIdAndDelete(appointmentId);
    }

    await mongoose.connection.close();
  });

  describe("POST /api/appointments", () => {
    test("should reject request without authentication", async () => {
      const response = await request(app)
        .post("/api/appointments")
        .send({
          patient: patientId,
          doctor: doctorId,
          appointmentDate: "2035-05-15",
          appointmentTime: "09:00",
          reason: "General consultation",
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should reject appointment creation for a doctor role", async () => {
      const response = await request(app)
        .post("/api/appointments")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          patient: patientId,
          doctor: doctorId,
          appointmentDate: "2035-05-16",
          appointmentTime: "10:00",
          reason: "Doctor authorization test",
        });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should reject appointment when required fields are missing", async () => {
      const response = await request(app)
        .post("/api/appointments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patientId,
          doctor: doctorId,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should reject appointment for a non-existing patient", async () => {
      const fakePatientId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post("/api/appointments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: fakePatientId,
          doctor: doctorId,
          appointmentDate: "2035-05-17",
          appointmentTime: "09:00",
          reason: "Invalid patient test",
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Active patient not found"
      );
    });

    test("should reject appointment for a non-existing doctor", async () => {
      const fakeDoctorId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post("/api/appointments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patientId,
          doctor: fakeDoctorId,
          appointmentDate: "2035-05-18",
          appointmentTime: "09:00",
          reason: "Invalid doctor test",
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Active doctor not found"
      );
    });

    test("should create an appointment successfully as admin", async () => {
      const response = await request(app)
        .post("/api/appointments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patientId,
          doctor: doctorId,
          appointmentDate: "2035-06-10",
          appointmentTime: "11:00",
          reason: "General health consultation",
          notes: "Integration test appointment",
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.appointment).toBeDefined();

      appointmentId =
        response.body.data.appointment._id;

      expect(appointmentId).toBeDefined();

      expect(
        response.body.data.appointment.patient
      ).toBeDefined();

      expect(
        response.body.data.appointment.doctor
      ).toBeDefined();

      expect(
        response.body.data.appointment.reason
      ).toBe("General health consultation");

      expect(
        response.body.data.appointment.appointmentTime
      ).toBe("11:00");

      expect(
        response.body.data.appointment.status
      ).toBe("scheduled");
    });

    test("should prevent double booking for the same doctor and time", async () => {
      const response = await request(app)
        .post("/api/appointments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patientId,
          doctor: doctorId,
          appointmentDate: "2035-06-10",
          appointmentTime: "11:00",
          reason: "Double booking test",
        });

      expect(response.statusCode).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "This doctor already has an appointment at this time"
      );
    });
  });

  describe("GET /api/appointments", () => {
    test("should get appointments successfully as admin", async () => {
      const response = await request(app)
        .get("/api/appointments")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(
        response.body.data.appointments
      ).toBeDefined();
      expect(
        Array.isArray(response.body.data.appointments)
      ).toBe(true);
    });

    test("should get appointments successfully as doctor", async () => {
      const response = await request(app)
        .get("/api/appointments")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(
        Array.isArray(response.body.data.appointments)
      ).toBe(true);
    });

    test("should reject request without authentication", async () => {
      const response = await request(app)
        .get("/api/appointments");

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/appointments/:id", () => {
    test("should get an appointment by ID", async () => {
      const response = await request(app)
        .get(`/api/appointments/${appointmentId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(
        response.body.data.appointment
      ).toBeDefined();

      expect(
        response.body.data.appointment._id
      ).toBe(appointmentId);
    });

    test("should return 404 for a non-existing appointment", async () => {
      const fakeAppointmentId =
        new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(
          `/api/appointments/${fakeAppointmentId}`
        )
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/appointments/:id", () => {
    test("should reject appointment update for a doctor role", async () => {
      const response = await request(app)
        .put(`/api/appointments/${appointmentId}`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          reason: "Unauthorized update",
        });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should update an appointment successfully as admin", async () => {
      const response = await request(app)
        .put(`/api/appointments/${appointmentId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          appointmentTime: "12:00",
          reason: "Updated consultation",
          status: "confirmed",
          notes: "Updated integration test appointment",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(
        response.body.data.appointment
      ).toBeDefined();

      expect(
        response.body.data.appointment.appointmentTime
      ).toBe("12:00");

      expect(
        response.body.data.appointment.reason
      ).toBe("Updated consultation");

      expect(
        response.body.data.appointment.status
      ).toBe("confirmed");
    });

    test("should prevent update when new date/time is already booked", async () => {
      const secondAppointment = await request(app)
        .post("/api/appointments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patientId,
          doctor: doctorId,
          appointmentDate: "2035-06-11",
          appointmentTime: "10:00",
          reason: "Second appointment",
        });

      expect(secondAppointment.statusCode).toBe(201);

      const secondAppointmentId =
        secondAppointment.body.data.appointment._id;

      const response = await request(app)
        .put(`/api/appointments/${appointmentId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          appointmentDate: "2035-06-11",
          appointmentTime: "10:00",
        });

      expect(response.statusCode).toBe(409);
      expect(response.body.success).toBe(false);

      await Appointment.findByIdAndDelete(
        secondAppointmentId
      );
    });
  });

  describe("DELETE /api/appointments/:id", () => {
    test("should reject appointment cancellation for a doctor role", async () => {
      const response = await request(app)
        .delete(`/api/appointments/${appointmentId}`)
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should cancel appointment successfully as admin", async () => {
      const response = await request(app)
        .delete(`/api/appointments/${appointmentId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(
        response.body.data.appointment
      ).toBeDefined();

      expect(
        response.body.data.appointment.status
      ).toBe("cancelled");
    });

    test("should return 404 when cancelling a non-existing appointment", async () => {
      const fakeAppointmentId =
        new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(
          `/api/appointments/${fakeAppointmentId}`
        )
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});