require("dotenv").config();

const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../app");
const connectDB = require("../config/db");

const Patient = require("../models/patient");

describe("Patient API - Integration Tests", () => {
  let adminToken;
  let doctorToken;
  let patientId;

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
  });

  afterAll(async () => {
    if (patientId) {
      await Patient.findByIdAndDelete(patientId);
    }

    await mongoose.connection.close();
  });

  describe("POST /api/patients", () => {
    test("should reject request without authentication", async () => {
      const response = await request(app)
        .post("/api/patients")
        .send({
          name: "Test Patient",
          dateOfBirth: "2000-01-01",
          gender: "male",
          phone: "9999999999",
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should create a patient successfully as admin", async () => {
      const response = await request(app)
        .post("/api/patients")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Integration Test Patient",
          dateOfBirth: "2000-01-15",
          gender: "male",
          phone: "9999999999",
          email: "patient.integration@clinic.com",
          address: "Greater Noida",
          bloodGroup: "O+",
          emergencyContact: {
            name: "Test Emergency Contact",
            phone: "8888888888",
            relationship: "Brother",
          },
          medicalHistory: "No major medical history",
          allergies: ["Dust"],
          notes: "Integration test patient",
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.patient).toBeDefined();

      patientId = response.body.data.patient._id;

      expect(patientId).toBeDefined();
      expect(response.body.data.patient.name).toBe(
        "Integration Test Patient"
      );
      expect(response.body.data.patient.gender).toBe("male");
      expect(response.body.data.patient.patientId).toMatch(/^PAT-\d{5}$/);
    });
  });

  describe("GET /api/patients", () => {
    test("should get patients successfully as admin", async () => {
      const response = await request(app)
        .get("/api/patients")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test("should get patients successfully as doctor", async () => {
      const response = await request(app)
        .get("/api/patients")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe("GET /api/patients/:id", () => {
    test("should get a patient by ID", async () => {
      const response = await request(app)
        .get(`/api/patients/${patientId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.patient).toBeDefined();
      expect(response.body.data.patient._id).toBe(patientId);
    });

    test("should return 404 for a non-existing patient", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/patients/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/patients/:id", () => {
    test("should update a patient successfully", async () => {
      const response = await request(app)
        .put(`/api/patients/${patientId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Updated Integration Patient",
          phone: "7777777777",
          address: "Noida",
          notes: "Updated patient information",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.patient).toBeDefined();
      expect(response.body.data.patient.name).toBe(
        "Updated Integration Patient"
      );
      expect(response.body.data.patient.phone).toBe("7777777777");
    });
  });

  describe("DELETE /api/patients/:id", () => {
    test("should reject patient deletion for doctor", async () => {
      const response = await request(app)
        .delete(`/api/patients/${patientId}`)
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should deactivate patient successfully as admin", async () => {
      const response = await request(app)
        .delete(`/api/patients/${patientId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      const deactivatedPatient = await Patient.findById(patientId);

      expect(deactivatedPatient).toBeDefined();
      expect(deactivatedPatient.isActive).toBe(false);
    });
  });
});