require("dotenv").config();

const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../app");
const connectDB = require("../config/db");

const User = require("../models/user");
const Doctor = require("../models/doctor");

describe("Doctor API - Integration Tests", () => {
  let adminToken;
  let doctorToken;
  let doctorId;
  let createdDoctorUserId;
  let createdDoctorLicense;

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
    if (doctorId) {
      const doctor = await Doctor.findById(doctorId);

      if (doctor) {
        await User.findByIdAndDelete(doctor.user);
        await Doctor.findByIdAndDelete(doctorId);
      }
    }

    await mongoose.connection.close();
  });

  describe("POST /api/doctors", () => {
    test("should reject request without authentication", async () => {
      const response = await request(app)
        .post("/api/doctors")
        .send({
          name: "Test Doctor",
          email: `noauth_${Date.now()}@clinic.com`,
          password: "Doctor@12345",
          specialization: "Cardiology",
          qualification: "MBBS, MD",
          licenseNumber: `NOAUTH-${Date.now()}`,
          experience: 5,
          consultationFee: 800,
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should reject doctor creation for a doctor role", async () => {
      const uniqueValue = Date.now();

      const response = await request(app)
        .post("/api/doctors")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          name: "Unauthorized Doctor",
          email: `unauthorized_${uniqueValue}@clinic.com`,
          password: "Doctor@12345",
          specialization: "Neurology",
          qualification: "MBBS, MD",
          licenseNumber: `UNAUTH-${uniqueValue}`,
          experience: 5,
          consultationFee: 800,
        });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should reject doctor creation when required fields are missing", async () => {
      const uniqueValue = Date.now();

      const response = await request(app)
        .post("/api/doctors")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Incomplete Doctor",
          email: `incomplete_${uniqueValue}@clinic.com`,
          password: "Doctor@12345",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should create a doctor successfully as admin", async () => {
      const uniqueValue = Date.now();

      const response = await request(app)
        .post("/api/doctors")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Integration Test Doctor",
          email: `doctor_${uniqueValue}@clinic.com`,
          phone: "9999999999",
          password: "Doctor@12345",
          specialization: "Cardiology",
          qualification: "MBBS, MD",
          licenseNumber: `TEST-LIC-${uniqueValue}`,
          experience: 8,
          consultationFee: 1000,
          availableDays: [
            "monday",
            "wednesday",
            "friday",
          ],
          availability: {
            startTime: "09:00",
            endTime: "17:00",
          },
          department: "Cardiology",
          bio: "Integration test doctor",
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.doctor).toBeDefined();

      doctorId = response.body.data.doctor._id;
      createdDoctorUserId = response.body.data.doctor.user._id;
      createdDoctorLicense =
        response.body.data.doctor.licenseNumber;

      expect(doctorId).toBeDefined();
      expect(createdDoctorUserId).toBeDefined();
      expect(createdDoctorLicense).toBeDefined();

      expect(response.body.data.doctor.specialization).toBe(
        "Cardiology"
      );

      expect(response.body.data.doctor.qualification).toBe(
        "MBBS, MD"
      );

      expect(response.body.data.doctor.experience).toBe(8);

      expect(response.body.data.doctor.consultationFee).toBe(
        1000
      );

      expect(response.body.data.doctor.user).toBeDefined();

      expect(response.body.data.doctor.user.role).toBe(
        "doctor"
      );

      expect(response.body.data.doctor.user.email).toBe(
        `doctor_${createdDoctorLicense.replace(
          "TEST-LIC-",
          ""
        )}@clinic.com`
      );
    });

    test("should reject duplicate email registration", async () => {
      const uniqueValue = Date.now();

      const response = await request(app)
        .post("/api/doctors")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Duplicate Email Doctor",
          email: "testdoctor@clinic.com",
          password: "Doctor@12345",
          specialization: "Dermatology",
          qualification: "MBBS, MD",
          licenseNumber: `DUP-EMAIL-${uniqueValue}`,
          experience: 4,
          consultationFee: 600,
        });

      expect(response.statusCode).toBe(409);
      expect(response.body.success).toBe(false);
    });

    test("should reject duplicate doctor license number", async () => {
      const uniqueValue = Date.now();

      const response = await request(app)
        .post("/api/doctors")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Duplicate License Doctor",
          email: `duplicate_license_${uniqueValue}@clinic.com`,
          password: "Doctor@12345",
          specialization: "Dermatology",
          qualification: "MBBS, MD",
          licenseNumber: createdDoctorLicense,
          experience: 4,
          consultationFee: 600,
        });

      expect(response.statusCode).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/doctors", () => {
    test("should get doctors successfully as admin", async () => {
      const response = await request(app)
        .get("/api/doctors")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.doctors).toBeDefined();
      expect(Array.isArray(response.body.data.doctors)).toBe(
        true
      );
    });

    test("should get doctors successfully as doctor", async () => {
      const response = await request(app)
        .get("/api/doctors")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.doctors).toBeDefined();
      expect(Array.isArray(response.body.data.doctors)).toBe(
        true
      );
    });

    test("should reject request without authentication", async () => {
      const response = await request(app)
        .get("/api/doctors");

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/doctors/:id", () => {
    test("should get a doctor by ID", async () => {
      const response = await request(app)
        .get(`/api/doctors/${doctorId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.doctor).toBeDefined();
      expect(response.body.data.doctor._id).toBe(doctorId);
    });

    test("should return 404 for a non-existing doctor", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/doctors/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/doctors/:id", () => {
    test("should reject doctor update for a doctor role", async () => {
      const response = await request(app)
        .put(`/api/doctors/${doctorId}`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          specialization: "Updated Cardiology",
        });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should update a doctor successfully as admin", async () => {
      const response = await request(app)
        .put(`/api/doctors/${doctorId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Updated Integration Doctor",
          phone: "7777777777",
          specialization: "Updated Cardiology",
          consultationFee: 1200,
          department: "Advanced Cardiology",
          bio: "Updated integration test doctor",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.doctor).toBeDefined();

      expect(
        response.body.data.doctor.specialization
      ).toBe("Updated Cardiology");

      expect(
        response.body.data.doctor.consultationFee
      ).toBe(1200);

      expect(
        response.body.data.doctor.department
      ).toBe("Advanced Cardiology");

      expect(
        response.body.data.doctor.user.name
      ).toBe("Updated Integration Doctor");

      expect(
        response.body.data.doctor.user.phone
      ).toBe("7777777777");
    });
  });

  describe("DELETE /api/doctors/:id", () => {
    test("should reject doctor deletion for a doctor role", async () => {
      const response = await request(app)
        .delete(`/api/doctors/${doctorId}`)
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should deactivate doctor successfully as admin", async () => {
      const response = await request(app)
        .delete(`/api/doctors/${doctorId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      const deactivatedDoctor = await Doctor.findById(
        doctorId
      );

      const deactivatedUser = await User.findById(
        createdDoctorUserId
      );

      expect(deactivatedDoctor).toBeDefined();
      expect(deactivatedDoctor.isActive).toBe(false);

      expect(deactivatedUser).toBeDefined();
      expect(deactivatedUser.isActive).toBe(false);
    });
  });
});