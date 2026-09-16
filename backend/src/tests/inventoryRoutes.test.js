require("dotenv").config();

const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const app = require("../app");
const connectDB = require("../config/db");

const User = require("../models/user");
const Inventory = require("../models/inventory");

describe("Inventory API - Integration Tests", () => {
  let adminUser;
  let doctorUser;
  let receptionistUser;

  let adminToken;
  let doctorToken;
  let receptionistToken;

  let inventoryItem;

  beforeAll(async () => {
    await connectDB();

    adminUser = await User.create({
      name: "Inventory Test Admin",
      email: `inventory_admin_${Date.now()}@clinic.com`,
      phone: "9300000001",
      password: "Admin@12345",
      role: "admin",
    });

    doctorUser = await User.create({
      name: "Inventory Test Doctor",
      email: `inventory_doctor_${Date.now()}@clinic.com`,
      phone: "9300000002",
      password: "Doctor@12345",
      role: "doctor",
    });

    receptionistUser = await User.create({
      name: "Inventory Test Receptionist",
      email: `inventory_receptionist_${Date.now()}@clinic.com`,
      phone: "9300000003",
      password: "Reception@12345",
      role: "receptionist",
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
  });

  afterAll(async () => {
    await Inventory.deleteMany({
      $or: [
        { createdBy: adminUser._id },
        { createdBy: doctorUser._id },
        { createdBy: receptionistUser._id },
      ],
    });

    await User.findByIdAndDelete(adminUser._id);
    await User.findByIdAndDelete(doctorUser._id);
    await User.findByIdAndDelete(receptionistUser._id);

    await mongoose.connection.close();
  });

  describe("POST /api/inventory", () => {
    test("should reject request without authentication", async () => {
      const response = await request(app)
        .post("/api/inventory")
        .send({
          name: "Test Medicine",
          category: "Medicine",
          purchasePrice: 100,
          sellingPrice: 150,
          quantity: 20,
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should reject inventory creation for doctor", async () => {
      const response = await request(app)
        .post("/api/inventory")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          name: "Test Medicine",
          category: "Medicine",
          purchasePrice: 100,
          sellingPrice: 150,
          quantity: 20,
        });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should reject request with missing required fields", async () => {
      const response = await request(app)
        .post("/api/inventory")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Test Medicine",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Name, category, purchase price and selling price are required"
      );
    });

    test("should reject negative purchase or selling price", async () => {
      const response = await request(app)
        .post("/api/inventory")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Test Medicine",
          category: "Medicine",
          purchasePrice: -100,
          sellingPrice: 150,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Purchase price and selling price cannot be negative"
      );
    });

    test("should reject negative quantity", async () => {
      const response = await request(app)
        .post("/api/inventory")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Test Medicine",
          category: "Medicine",
          purchasePrice: 100,
          sellingPrice: 150,
          quantity: -5,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Quantity cannot be negative"
      );
    });

    test("should reject negative reorder level", async () => {
      const response = await request(app)
        .post("/api/inventory")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Test Medicine",
          category: "Medicine",
          purchasePrice: 100,
          sellingPrice: 150,
          quantity: 20,
          reorderLevel: -1,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Reorder level cannot be negative"
      );
    });

    test("should reject expiry date in the past", async () => {
      const response = await request(app)
        .post("/api/inventory")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Expired Medicine",
          category: "Medicine",
          purchasePrice: 100,
          sellingPrice: 150,
          quantity: 20,
          expiryDate: "2020-01-01",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Expiry date cannot be in the past"
      );
    });

    test("should create inventory item successfully as admin", async () => {
      const response = await request(app)
        .post("/api/inventory")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Paracetamol 500mg",
          category: "Medicine",
          description: "Pain and fever medicine",
          manufacturer: "Test Pharma",
          supplier: "Test Supplier",
          batchNumber: "BATCH-001",
          expiryDate: "2035-12-31",
          purchasePrice: 50,
          sellingPrice: 80,
          quantity: 20,
          unit: "strip",
          reorderLevel: 10,
          location: "Main Pharmacy",
          notes: "Inventory test item",
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.inventoryItem).toBeDefined();

      inventoryItem = response.body.data.inventoryItem;

      expect(inventoryItem.itemCode).toMatch(
        /^INV-ITEM-\d{5}$/
      );
      expect(inventoryItem.name).toBe("Paracetamol 500mg");
      expect(inventoryItem.category).toBe("Medicine");
      expect(inventoryItem.purchasePrice).toBe(50);
      expect(inventoryItem.sellingPrice).toBe(80);
      expect(inventoryItem.quantity).toBe(20);
      expect(inventoryItem.reorderLevel).toBe(10);
      expect(inventoryItem.isActive).toBe(true);
    });

    test("should create inventory item successfully as receptionist", async () => {
      const response = await request(app)
        .post("/api/inventory")
        .set("Authorization", `Bearer ${receptionistToken}`)
        .send({
          name: "Reception Test Item",
          category: "Supplies",
          purchasePrice: 20,
          sellingPrice: 30,
          quantity: 5,
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.inventoryItem).toBeDefined();

      await Inventory.findByIdAndDelete(
        response.body.data.inventoryItem._id
      );
    });
  });

  describe("GET /api/inventory", () => {
    test("should reject request without authentication", async () => {
      const response = await request(app).get("/api/inventory");

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should allow admin to retrieve inventory items", async () => {
      const response = await request(app)
        .get("/api/inventory")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.inventoryItems).toBeDefined();
      expect(
        Array.isArray(response.body.data.inventoryItems)
      ).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(1);
    });

    test("should allow doctor to retrieve inventory items", async () => {
      const response = await request(app)
        .get("/api/inventory")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.inventoryItems).toBeDefined();
    });

    test("should allow receptionist to retrieve inventory items", async () => {
      const response = await request(app)
        .get("/api/inventory")
        .set("Authorization", `Bearer ${receptionistToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.inventoryItems).toBeDefined();
    });
  });

  describe("GET /api/inventory/:id", () => {
    test("should retrieve inventory item by ID", async () => {
      const response = await request(app)
        .get(`/api/inventory/${inventoryItem._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.inventoryItem).toBeDefined();

      expect(response.body.data.inventoryItem._id).toBe(
        inventoryItem._id.toString()
      );
    });

    test("should allow doctor to retrieve inventory item by ID", async () => {
      const response = await request(app)
        .get(`/api/inventory/${inventoryItem._id}`)
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should return 404 for a non-existing inventory item", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/inventory/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Inventory item not found"
      );
    });
  });

  describe("GET /api/inventory/low-stock", () => {
    test("should return low-stock inventory items", async () => {
      const lowStockItem = await Inventory.create({
        name: "Low Stock Test Item",
        category: "Supplies",
        purchasePrice: 10,
        sellingPrice: 20,
        quantity: 3,
        reorderLevel: 10,
        createdBy: adminUser._id,
      });

      const response = await request(app)
        .get("/api/inventory/low-stock")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.inventoryItems).toBeDefined();

      const found = response.body.data.inventoryItems.find(
        (item) => item._id === lowStockItem._id.toString()
      );

      expect(found).toBeDefined();
      expect(found.quantity).toBe(3);

      await Inventory.findByIdAndDelete(lowStockItem._id);
    });

    test("should allow doctor to view low-stock items", async () => {
      const response = await request(app)
        .get("/api/inventory/low-stock")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /api/inventory/expired", () => {
    test("should return expired inventory items", async () => {
      const expiredItem = await Inventory.create({
        name: "Expired Test Item",
        category: "Medicine",
        purchasePrice: 10,
        sellingPrice: 20,
        quantity: 5,
        expiryDate: new Date("2020-01-01"),
        createdBy: adminUser._id,
      });

      const response = await request(app)
        .get("/api/inventory/expired")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.inventoryItems).toBeDefined();

      const found = response.body.data.inventoryItems.find(
        (item) => item._id === expiredItem._id.toString()
      );

      expect(found).toBeDefined();

      await Inventory.findByIdAndDelete(expiredItem._id);
    });

    test("should allow receptionist to view expired items", async () => {
      const response = await request(app)
        .get("/api/inventory/expired")
        .set("Authorization", `Bearer ${receptionistToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("PATCH /api/inventory/:id/add-stock", () => {
    test("should reject add-stock without authentication", async () => {
      const response = await request(app)
        .patch(`/api/inventory/${inventoryItem._id}/add-stock`)
        .send({
          quantity: 5,
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should reject add-stock for doctor", async () => {
      const response = await request(app)
        .patch(`/api/inventory/${inventoryItem._id}/add-stock`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          quantity: 5,
        });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should reject zero or negative stock quantity", async () => {
      const response = await request(app)
        .patch(`/api/inventory/${inventoryItem._id}/add-stock`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          quantity: 0,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "A positive quantity is required"
      );
    });

    test("should add stock successfully", async () => {
      const response = await request(app)
        .patch(`/api/inventory/${inventoryItem._id}/add-stock`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          quantity: 15,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Stock added successfully"
      );

      expect(
        response.body.data.inventoryItem.quantity
      ).toBe(35);
    });

    test("should allow receptionist to add stock", async () => {
      const response = await request(app)
        .patch(`/api/inventory/${inventoryItem._id}/add-stock`)
        .set("Authorization", `Bearer ${receptionistToken}`)
        .send({
          quantity: 5,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(
        response.body.data.inventoryItem.quantity
      ).toBe(40);
    });
  });

  describe("PATCH /api/inventory/:id/remove-stock", () => {
    test("should reject remove-stock without authentication", async () => {
      const response = await request(app)
        .patch(`/api/inventory/${inventoryItem._id}/remove-stock`)
        .send({
          quantity: 5,
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should reject remove-stock for doctor", async () => {
      const response = await request(app)
        .patch(`/api/inventory/${inventoryItem._id}/remove-stock`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          quantity: 5,
        });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should reject zero or negative remove quantity", async () => {
      const response = await request(app)
        .patch(`/api/inventory/${inventoryItem._id}/remove-stock`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          quantity: 0,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "A positive quantity is required"
      );
    });

    test("should reject removal when stock is insufficient", async () => {
      const response = await request(app)
        .patch(`/api/inventory/${inventoryItem._id}/remove-stock`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          quantity: 1000,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Insufficient stock available"
      );
    });

    test("should remove stock successfully", async () => {
      const response = await request(app)
        .patch(`/api/inventory/${inventoryItem._id}/remove-stock`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          quantity: 10,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Stock removed successfully"
      );

      expect(
        response.body.data.inventoryItem.quantity
      ).toBe(30);
    });
  });

  describe("PUT /api/inventory/:id", () => {
    test("should reject update without authentication", async () => {
      const response = await request(app)
        .put(`/api/inventory/${inventoryItem._id}`)
        .send({
          name: "Updated Medicine",
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should reject update for doctor", async () => {
      const response = await request(app)
        .put(`/api/inventory/${inventoryItem._id}`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          name: "Updated Medicine",
        });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should reject negative purchase price during update", async () => {
      const response = await request(app)
        .put(`/api/inventory/${inventoryItem._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          purchasePrice: -50,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Purchase price cannot be negative"
      );
    });

    test("should reject negative selling price during update", async () => {
      const response = await request(app)
        .put(`/api/inventory/${inventoryItem._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          sellingPrice: -50,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Selling price cannot be negative"
      );
    });

    test("should reject negative quantity during update", async () => {
      const response = await request(app)
        .put(`/api/inventory/${inventoryItem._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          quantity: -5,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Quantity cannot be negative"
      );
    });

    test("should reject negative reorder level during update", async () => {
      const response = await request(app)
        .put(`/api/inventory/${inventoryItem._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          reorderLevel: -5,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Reorder level cannot be negative"
      );
    });

    test("should reject past expiry date during update", async () => {
      const response = await request(app)
        .put(`/api/inventory/${inventoryItem._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          expiryDate: "2020-01-01",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Expiry date cannot be in the past"
      );
    });

    test("should update inventory item successfully as admin", async () => {
      const response = await request(app)
        .put(`/api/inventory/${inventoryItem._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Paracetamol Updated",
          sellingPrice: 90,
          reorderLevel: 15,
          location: "Updated Pharmacy",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Inventory item updated successfully"
      );

      expect(
        response.body.data.inventoryItem.name
      ).toBe("Paracetamol Updated");

      expect(
        response.body.data.inventoryItem.sellingPrice
      ).toBe(90);

      expect(
        response.body.data.inventoryItem.reorderLevel
      ).toBe(15);

      expect(
        response.body.data.inventoryItem.location
      ).toBe("Updated Pharmacy");
    });

    test("should update inventory item successfully as receptionist", async () => {
      const response = await request(app)
        .put(`/api/inventory/${inventoryItem._id}`)
        .set("Authorization", `Bearer ${receptionistToken}`)
        .send({
          description: "Updated by receptionist",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(
        response.body.data.inventoryItem.description
      ).toBe("Updated by receptionist");
    });

    test("should return 404 when updating non-existing item", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/inventory/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Does Not Exist",
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Inventory item not found"
      );
    });
  });

  describe("DELETE /api/inventory/:id", () => {
    test("should reject deletion without authentication", async () => {
      const response = await request(app).delete(
        `/api/inventory/${inventoryItem._id}`
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should reject deactivation for doctor", async () => {
      const response = await request(app)
        .delete(`/api/inventory/${inventoryItem._id}`)
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should reject deactivation for receptionist", async () => {
      const response = await request(app)
        .delete(`/api/inventory/${inventoryItem._id}`)
        .set("Authorization", `Bearer ${receptionistToken}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should deactivate inventory item successfully as admin", async () => {
      const response = await request(app)
        .delete(`/api/inventory/${inventoryItem._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Inventory item deactivated successfully"
      );

      const deactivatedItem = await Inventory.findById(
        inventoryItem._id
      );

      expect(deactivatedItem).toBeDefined();
      expect(deactivatedItem.isActive).toBe(false);
    });

    test("should not retrieve deactivated inventory item", async () => {
      const response = await request(app)
        .get(`/api/inventory/${inventoryItem._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Inventory item not found"
      );
    });

    test("should return 404 when deactivating non-existing item", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/inventory/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Inventory item not found"
      );
    });
  });
});