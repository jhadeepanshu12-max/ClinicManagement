require("dotenv").config();

const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = require("../app");
const connectDB = require("../config/db");

const User = require("../models/user");
const Patient = require("../models/patient");
const Doctor = require("../models/doctor");
const Appointment = require("../models/appointment");
const Billing = require("../models/billing");
const Expense = require("../models/expense");
const Inventory = require("../models/inventory");
const Prescription = require("../models/prescription");

let adminUser;
let doctorUser;
let receptionistUser;

let doctor;
let patient;
let appointment;

let adminToken;
let doctorToken;
let receptionistToken;

const createToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );
};

const ensureDatabaseConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve, reject) => {
      const onConnected = () => {
        cleanup();
        resolve();
      };

      const onError = (error) => {
        cleanup();
        reject(error);
      };

      const cleanup = () => {
        mongoose.connection.off("connected", onConnected);
        mongoose.connection.off("error", onError);
      };

      mongoose.connection.once("connected", onConnected);
      mongoose.connection.once("error", onError);
    });

    return;
  }

  await connectDB();
};

describe("Dashboard Routes", () => {
  beforeAll(async () => {
    await ensureDatabaseConnection();

    await Expense.deleteMany({});
    await Billing.deleteMany({});
    await Prescription.deleteMany({});
    await Appointment.deleteMany({});
    await Inventory.deleteMany({});
    await Patient.deleteMany({});
    await Doctor.deleteMany({});

    await User.deleteMany({
      email: {
        $in: [
          "dashboard.admin@test.com",
          "dashboard.doctor@test.com",
          "dashboard.receptionist@test.com",
        ],
      },
    });

    const password = await bcrypt.hash("Test@123456", 10);

    adminUser = await User.create({
      name: "Dashboard Admin",
      email: "dashboard.admin@test.com",
      phone: "9100000001",
      password,
      role: "admin",
    });

    doctorUser = await User.create({
      name: "Dashboard Doctor",
      email: "dashboard.doctor@test.com",
      phone: "9100000002",
      password,
      role: "doctor",
    });

    receptionistUser = await User.create({
      name: "Dashboard Receptionist",
      email: "dashboard.receptionist@test.com",
      phone: "9100000003",
      password,
      role: "receptionist",
    });

    adminToken = createToken(adminUser);
    doctorToken = createToken(doctorUser);
    receptionistToken = createToken(receptionistUser);

    doctor = await Doctor.create({
      user: doctorUser._id,
      specialization: "General Medicine",
      qualification: "MBBS",
      licenseNumber: "DASH-LIC-001",
      experience: 5,
      consultationFee: 500,
      availableDays: ["monday", "tuesday", "wednesday"],
      availability: {
        startTime: "09:00",
        endTime: "17:00",
      },
      department: "General Medicine",
      bio: "Dashboard test doctor",
    });

    patient = await Patient.create({
      name: "Dashboard Test Patient",
      dateOfBirth: "2000-01-01",
      gender: "male",
      phone: "9200000001",
      email: "dashboard.patient@test.com",
      address: "Test Address",
      bloodGroup: "O+",
      createdBy: adminUser._id,
    });

    appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      appointmentDate: new Date(),
      appointmentTime: "10:00",
      reason: "Dashboard testing",
      status: "completed",
      consultationFee: 500,
      createdBy: adminUser._id,
    });
  });

  afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await Expense.deleteMany({});
      await Billing.deleteMany({});
      await Prescription.deleteMany({});
      await Inventory.deleteMany({});
      await Appointment.deleteMany({});
      await Patient.deleteMany({});
      await Doctor.deleteMany({});
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await Expense.deleteMany({});
      await Billing.deleteMany({});
      await Prescription.deleteMany({});
      await Appointment.deleteMany({});
      await Inventory.deleteMany({});
      await Patient.deleteMany({});
      await Doctor.deleteMany({});

      await User.deleteMany({
        email: {
          $in: [
            "dashboard.admin@test.com",
            "dashboard.doctor@test.com",
            "dashboard.receptionist@test.com",
          ],
        },
      });

      await mongoose.connection.close();
    }
  });

  // --------------------------------------------------
  // DASHBOARD STATS
  // --------------------------------------------------

  describe("GET /api/dashboard/stats", () => {
    test("should get dashboard statistics as admin", async () => {
      const response = await request(app)
        .get("/api/dashboard/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.patients).toBeDefined();
      expect(response.body.data.doctors).toBeDefined();
      expect(response.body.data.appointments).toBeDefined();
      expect(response.body.data.finance).toBeDefined();
      expect(response.body.data.inventory).toBeDefined();
    });

    test("should get dashboard statistics as doctor", async () => {
      const response = await request(app)
        .get("/api/dashboard/stats")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should get dashboard statistics as receptionist", async () => {
      const response = await request(app)
        .get("/api/dashboard/stats")
        .set("Authorization", `Bearer ${receptionistToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should reject dashboard stats without authentication", async () => {
      const response = await request(app).get("/api/dashboard/stats");

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // --------------------------------------------------
  // RECENT APPOINTMENTS
  // --------------------------------------------------

  describe("GET /api/dashboard/recent-appointments", () => {
    test("should get recent appointments as admin", async () => {
      const response = await request(app)
        .get("/api/dashboard/recent-appointments")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.appointments)).toBe(true);
    });

    test("should respect limit parameter", async () => {
      const response = await request(app)
        .get("/api/dashboard/recent-appointments?limit=1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments.length).toBeLessThanOrEqual(1);
    });

    test("should reject invalid authentication", async () => {
      const response = await request(app)
        .get("/api/dashboard/recent-appointments")
        .set("Authorization", "Bearer invalid-token");

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should reject unauthenticated request", async () => {
      const response = await request(app).get(
        "/api/dashboard/recent-appointments"
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // --------------------------------------------------
  // MONTHLY FINANCE
  // --------------------------------------------------

  describe("GET /api/dashboard/monthly-finance", () => {
    test("should get monthly finance analytics", async () => {
      const response = await request(app)
        .get("/api/dashboard/monthly-finance")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.monthly).toHaveLength(12);
      expect(response.body.data.totals).toBeDefined();
    });

    test("should accept a valid year", async () => {
      const response = await request(app)
        .get("/api/dashboard/monthly-finance?year=2025")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.year).toBe(2025);
    });

    test("should reject year below 2000", async () => {
      const response = await request(app)
        .get("/api/dashboard/monthly-finance?year=1999")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should reject year above 2100", async () => {
      const response = await request(app)
        .get("/api/dashboard/monthly-finance?year=2101")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should reject unauthenticated request", async () => {
      const response = await request(app).get(
        "/api/dashboard/monthly-finance"
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // --------------------------------------------------
  // APPOINTMENT ANALYTICS
  // --------------------------------------------------

  describe("GET /api/dashboard/appointment-analytics", () => {
    test("should get appointment analytics", async () => {
      const response = await request(app)
        .get("/api/dashboard/appointment-analytics")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.monthly).toHaveLength(12);
      expect(response.body.data.totals).toBeDefined();
    });

    test("should accept a valid year", async () => {
      const response = await request(app)
        .get("/api/dashboard/appointment-analytics?year=2025")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.year).toBe(2025);
    });

    test("should reject invalid year", async () => {
      const response = await request(app)
        .get("/api/dashboard/appointment-analytics?year=1999")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should reject unauthenticated request", async () => {
      const response = await request(app).get(
        "/api/dashboard/appointment-analytics"
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // --------------------------------------------------
  // DOCTOR ANALYTICS
  // --------------------------------------------------

  describe("GET /api/dashboard/doctor-analytics", () => {
    test("should get doctor analytics as admin", async () => {
      const response = await request(app)
        .get("/api/dashboard/doctor-analytics")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.doctors)).toBe(true);
    });

    test("should get doctor analytics as doctor", async () => {
      const response = await request(app)
        .get("/api/dashboard/doctor-analytics")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should accept a valid year", async () => {
      const response = await request(app)
        .get("/api/dashboard/doctor-analytics?year=2025")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.year).toBe(2025);
    });

    test("should reject invalid year", async () => {
      const response = await request(app)
        .get("/api/dashboard/doctor-analytics?year=2101")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should reject unauthenticated request", async () => {
      const response = await request(app).get(
        "/api/dashboard/doctor-analytics"
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // --------------------------------------------------
  // PATIENT ANALYTICS
  // --------------------------------------------------

  describe("GET /api/dashboard/patient-analytics", () => {
    test("should get patient analytics as admin", async () => {
      const response = await request(app)
        .get("/api/dashboard/patient-analytics")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);
    });

    test("should get patient analytics as doctor", async () => {
      const response = await request(app)
        .get("/api/dashboard/patient-analytics")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should get patient analytics as receptionist", async () => {
      const response = await request(app)
        .get("/api/dashboard/patient-analytics")
        .set("Authorization", `Bearer ${receptionistToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should reject unauthenticated request", async () => {
      const response = await request(app).get(
        "/api/dashboard/patient-analytics"
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});