require("dotenv").config();

const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = require("../app");
const connectDB = require("../config/db");

const User = require("../models/user");
const Expense = require("../models/expense");

let adminUser;
let receptionistUser;
let doctorUser;

let adminToken;
let receptionistToken;
let doctorToken;

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

describe("Expense Routes", () => {
  beforeAll(async () => {
    await ensureDatabaseConnection();

    const hashedAdminPassword = await bcrypt.hash("Test@123456", 10);
    const hashedReceptionistPassword = await bcrypt.hash(
      "Reception@12345",
      10
    );
    const hashedDoctorPassword = await bcrypt.hash(
      "Doctor@12345",
      10
    );

    await User.deleteMany({
      email: {
        $in: [
          "expense.admin@test.com",
          "expense.receptionist@test.com",
          "expense.doctor@test.com",
        ],
      },
    });

    adminUser = await User.create({
      name: "Expense Test Admin",
      email: "expense.admin@test.com",
      phone: "9000000001",
      password: hashedAdminPassword,
      role: "admin",
    });

    receptionistUser = await User.create({
      name: "Expense Test Receptionist",
      email: "expense.receptionist@test.com",
      phone: "9000000002",
      password: hashedReceptionistPassword,
      role: "receptionist",
    });

    doctorUser = await User.create({
      name: "Expense Test Doctor",
      email: "expense.doctor@test.com",
      phone: "9000000003",
      password: hashedDoctorPassword,
      role: "doctor",
    });

    adminToken = createToken(adminUser);
    receptionistToken = createToken(receptionistUser);
    doctorToken = createToken(doctorUser);
  });

  afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await Expense.deleteMany({});
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await Expense.deleteMany({});

      await User.deleteMany({
        email: {
          $in: [
            "expense.admin@test.com",
            "expense.receptionist@test.com",
            "expense.doctor@test.com",
          ],
        },
      });

      await mongoose.connection.close();
    }
  });

  // --------------------------------------------------
  // CREATE EXPENSE
  // --------------------------------------------------

  describe("POST /api/expenses", () => {
    test("should create an expense as admin", async () => {
      const response = await request(app)
        .post("/api/expenses")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          category: "utilities",
          amount: 1500,
          description: "Electricity bill",
          vendor: "Electricity Provider",
          paymentMethod: "upi",
          expenseDate: "2025-06-15",
          receiptNumber: "REC-001",
          notes: "Monthly electricity bill",
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.expense).toBeDefined();
      expect(response.body.data.expense.category).toBe("utilities");
      expect(response.body.data.expense.amount).toBe(1500);
      expect(response.body.data.expense.expenseNumber).toMatch(/^EXP-/);
    });

    test("should create an expense as receptionist", async () => {
      const response = await request(app)
        .post("/api/expenses")
        .set("Authorization", `Bearer ${receptionistToken}`)
        .send({
          category: "office-supplies",
          amount: 800,
          description: "Office stationery",
          paymentMethod: "cash",
          expenseDate: "2025-06-15",
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test("should reject expense creation by doctor", async () => {
      const response = await request(app)
        .post("/api/expenses")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          category: "utilities",
          amount: 500,
          description: "Test expense",
          expenseDate: "2025-06-15",
        });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should reject expense without authentication", async () => {
      const response = await request(app)
        .post("/api/expenses")
        .send({
          category: "utilities",
          amount: 500,
          description: "Test expense",
          expenseDate: "2025-06-15",
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should reject missing category", async () => {
      const response = await request(app)
        .post("/api/expenses")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          amount: 500,
          description: "Test expense",
          expenseDate: "2025-06-15",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should reject missing amount", async () => {
      const response = await request(app)
        .post("/api/expenses")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          category: "utilities",
          description: "Test expense",
          expenseDate: "2025-06-15",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should reject missing description", async () => {
      const response = await request(app)
        .post("/api/expenses")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          category: "utilities",
          amount: 500,
          expenseDate: "2025-06-15",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should reject negative amount", async () => {
      const response = await request(app)
        .post("/api/expenses")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          category: "utilities",
          amount: -500,
          description: "Invalid expense",
          expenseDate: "2025-06-15",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should reject future expense date", async () => {
      const response = await request(app)
        .post("/api/expenses")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          category: "utilities",
          amount: 500,
          description: "Future expense",
          expenseDate: "2030-06-15",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should reject invalid category", async () => {
      const response = await request(app)
        .post("/api/expenses")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          category: "invalid-category",
          amount: 500,
          description: "Invalid category",
          expenseDate: "2025-06-15",
        });

      expect(response.statusCode).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  // --------------------------------------------------
  // GET EXPENSES
  // --------------------------------------------------

  describe("GET /api/expenses", () => {
    beforeEach(async () => {
      await Expense.create([
        {
          category: "utilities",
          amount: 1000,
          description: "Electricity",
          paymentMethod: "upi",
          expenseDate: "2025-06-01",
          createdBy: adminUser._id,
        },
        {
          category: "medical-supplies",
          amount: 2500,
          description: "Medical supplies",
          paymentMethod: "card",
          expenseDate: "2025-06-05",
          createdBy: adminUser._id,
        },
      ]);
    });

    test("should get expenses as admin", async () => {
      const response = await request(app)
        .get("/api/expenses")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.expenses)).toBe(true);
      expect(response.body.data.expenses.length).toBe(2);
    });

    test("should get expenses as doctor", async () => {
      const response = await request(app)
        .get("/api/expenses")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should get expenses as receptionist", async () => {
      const response = await request(app)
        .get("/api/expenses")
        .set("Authorization", `Bearer ${receptionistToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should reject unauthenticated request", async () => {
      const response = await request(app).get("/api/expenses");

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // --------------------------------------------------
  // GET EXPENSE BY ID
  // --------------------------------------------------

  describe("GET /api/expenses/:id", () => {
    let expense;

    beforeEach(async () => {
      expense = await Expense.create({
        category: "maintenance",
        amount: 3000,
        description: "AC maintenance",
        paymentMethod: "cash",
        expenseDate: "2025-06-10",
        createdBy: adminUser._id,
      });
    });

    test("should get expense by ID", async () => {
      const response = await request(app)
        .get(`/api/expenses/${expense._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.expense._id).toBe(expense._id.toString());
    });

    test("should return 404 for non-existing expense", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/expenses/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test("should reject unauthenticated request", async () => {
      const response = await request(app).get(
        `/api/expenses/${expense._id}`
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // --------------------------------------------------
  // UPDATE EXPENSE
  // --------------------------------------------------

  describe("PUT /api/expenses/:id", () => {
    let expense;

    beforeEach(async () => {
      expense = await Expense.create({
        category: "utilities",
        amount: 1000,
        description: "Old electricity bill",
        paymentMethod: "cash",
        expenseDate: "2025-06-10",
        createdBy: adminUser._id,
      });
    });

    test("should update expense as admin", async () => {
      const response = await request(app)
        .put(`/api/expenses/${expense._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          amount: 2000,
          description: "Updated electricity bill",
          paymentMethod: "upi",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.expense.amount).toBe(2000);
      expect(response.body.data.expense.description).toBe(
        "Updated electricity bill"
      );
    });

    test("should update expense as receptionist", async () => {
      const response = await request(app)
        .put(`/api/expenses/${expense._id}`)
        .set("Authorization", `Bearer ${receptionistToken}`)
        .send({
          amount: 1500,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should reject update by doctor", async () => {
      const response = await request(app)
        .put(`/api/expenses/${expense._id}`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          amount: 2000,
        });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should reject negative update amount", async () => {
      const response = await request(app)
        .put(`/api/expenses/${expense._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          amount: -100,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should reject future update date", async () => {
      const response = await request(app)
        .put(`/api/expenses/${expense._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          expenseDate: "2030-06-15",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should return 404 when updating missing expense", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/expenses/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          amount: 2000,
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // --------------------------------------------------
  // CATEGORY
  // --------------------------------------------------

  describe("GET /api/expenses/category/:category", () => {
    beforeEach(async () => {
      await Expense.create([
        {
          category: "utilities",
          amount: 1000,
          description: "Electricity",
          expenseDate: "2025-06-01",
          createdBy: adminUser._id,
        },
        {
          category: "utilities",
          amount: 2000,
          description: "Internet",
          expenseDate: "2025-06-02",
          createdBy: adminUser._id,
        },
        {
          category: "salary",
          amount: 5000,
          description: "Staff salary",
          expenseDate: "2025-06-03",
          createdBy: adminUser._id,
        },
      ]);
    });

    test("should get expenses by category", async () => {
      const response = await request(app)
        .get("/api/expenses/category/utilities")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.expenses.length).toBe(2);
    });

    test("should allow doctor to get category expenses", async () => {
      const response = await request(app)
        .get("/api/expenses/category/utilities")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should return empty array for category with no expenses", async () => {
      const response = await request(app)
        .get("/api/expenses/category/marketing")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.expenses).toEqual([]);
    });
  });

  // --------------------------------------------------
  // SUMMARY
  // --------------------------------------------------

  describe("GET /api/expenses/summary", () => {
    beforeEach(async () => {
      await Expense.create([
        {
          category: "utilities",
          amount: 1000,
          description: "Electricity",
          expenseDate: "2025-06-01",
          createdBy: adminUser._id,
        },
        {
          category: "salary",
          amount: 5000,
          description: "Salary",
          expenseDate: "2025-06-02",
          createdBy: adminUser._id,
        },
        {
          category: "medical-supplies",
          amount: 2000,
          description: "Medical supplies",
          expenseDate: "2025-06-03",
          createdBy: adminUser._id,
        },
      ]);
    });

    test("should get expense summary as admin", async () => {
      const response = await request(app)
        .get("/api/expenses/summary")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test("should get expense summary as doctor", async () => {
      const response = await request(app)
        .get("/api/expenses/summary")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should get expense summary as receptionist", async () => {
      const response = await request(app)
        .get("/api/expenses/summary")
        .set("Authorization", `Bearer ${receptionistToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should reject unauthenticated summary request", async () => {
      const response = await request(app).get("/api/expenses/summary");

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // --------------------------------------------------
  // DEACTIVATE EXPENSE
  // --------------------------------------------------

  describe("DELETE /api/expenses/:id", () => {
    let expense;

    beforeEach(async () => {
      expense = await Expense.create({
        category: "maintenance",
        amount: 1000,
        description: "Maintenance expense",
        expenseDate: "2025-06-10",
        createdBy: adminUser._id,
      });
    });

    test("should deactivate expense as admin", async () => {
      const response = await request(app)
        .delete(`/api/expenses/${expense._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedExpense = await Expense.findById(expense._id);

      expect(deletedExpense.isActive).toBe(false);
    });

    test("should reject delete by receptionist", async () => {
      const response = await request(app)
        .delete(`/api/expenses/${expense._id}`)
        .set("Authorization", `Bearer ${receptionistToken}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should reject delete by doctor", async () => {
      const response = await request(app)
        .delete(`/api/expenses/${expense._id}`)
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should reject unauthenticated delete", async () => {
      const response = await request(app).delete(
        `/api/expenses/${expense._id}`
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should return 404 for deleting non-existing expense", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/expenses/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});