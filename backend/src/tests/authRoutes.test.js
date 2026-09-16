require("dotenv").config();

const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const app = require("../app");
const connectDB = require("../config/db");
const User = require("../models/user");

describe("Auth API - Integration Tests", () => {
  const testEmail = `integration_${Date.now()}@clinic.com`;
  const testPassword = "Test@12345";

  let registeredUserId;
  let authToken;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    if (registeredUserId) {
      await User.findByIdAndDelete(registeredUserId);
    }

    await mongoose.connection.close();
  });

  describe("POST /api/auth/register", () => {
    test("should register a new user successfully", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Integration Test User",
          email: testEmail,
          phone: "9999999999",
          password: testPassword,
          role: "patient",
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();

      registeredUserId = response.body.data.user.id;
      authToken = response.body.data.token;

      expect(response.body.data.user.email).toBe(testEmail);
      expect(response.body.data.user.role).toBe("patient");
    });

    test("should reject duplicate email registration", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Duplicate User",
          email: testEmail,
          phone: "8888888888",
          password: testPassword,
          role: "patient",
        });

      expect(response.statusCode).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/login", () => {
    test("should login successfully with valid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();

      const token = response.body.data.token;

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      expect(decoded.userId).toBe(registeredUserId);
    });

    test("should reject login with incorrect password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testEmail,
          password: "Wrong@12345",
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should reject login for a non-existing user", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "doesnotexist@clinic.com",
          password: testPassword,
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Protected User API", () => {
    test("should reject request without authentication token", async () => {
      const response = await request(app)
        .get("/api/users/me");

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should allow request with a valid authentication token", async () => {
      const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(testEmail);
    });
  });
});