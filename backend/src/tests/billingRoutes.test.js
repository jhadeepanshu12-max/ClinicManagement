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
const Billing = require("../models/billing");

describe("Billing API - Integration Tests", () => {
  let adminUser;
  let doctorUser;
  let receptionistUser;
  let patient;
  let doctor;
  let appointment;
  let secondAppointment;

  let billing;

  let adminToken;
  let doctorToken;
  let receptionistToken;

  beforeAll(async () => {
    await connectDB();

    adminUser = await User.create({
      name: "Billing Test Admin",
      email: `billing_admin_${Date.now()}@clinic.com`,
      phone: "9200000001",
      password: "Admin@12345",
      role: "admin",
    });

    doctorUser = await User.create({
      name: "Billing Test Doctor",
      email: `billing_doctor_${Date.now()}@clinic.com`,
      phone: "9200000002",
      password: "Doctor@12345",
      role: "doctor",
    });

    receptionistUser = await User.create({
      name: "Billing Test Receptionist",
      email: `billing_receptionist_${Date.now()}@clinic.com`,
      phone: "9200000003",
      password: "Reception@12345",
      role: "receptionist",
    });

    doctor = await Doctor.create({
      user: doctorUser._id,
      specialization: "General Medicine",
      qualification: "MBBS",
      licenseNumber: `BILL-LIC-${Date.now()}`,
      experience: 7,
      consultationFee: 1000,
      availableDays: ["monday", "tuesday", "wednesday"],
      availability: {
        startTime: "09:00",
        endTime: "17:00",
      },
      department: "General Medicine",
      bio: "Billing integration test doctor",
    });

    patient = await Patient.create({
      name: "Billing Test Patient",
      dateOfBirth: "1998-04-15",
      gender: "female",
      phone: "9200000010",
      email: `billing_patient_${Date.now()}@clinic.com`,
      address: "Billing Test Address",
      bloodGroup: "A+",
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
      appointmentDate: new Date("2035-09-10"),
      appointmentTime: "10:00",
      reason: "General consultation",
      consultationFee: 1000,
      notes: "Billing primary appointment",
      createdBy: adminUser._id,
    });

    secondAppointment = await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      appointmentDate: new Date("2035-09-11"),
      appointmentTime: "11:00",
      reason: "Follow-up consultation",
      consultationFee: 1000,
      notes: "Billing secondary appointment",
      createdBy: adminUser._id,
    });
  });

  afterAll(async () => {
    if (billing?._id) {
      await Billing.findByIdAndDelete(billing._id);
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

  describe("POST /api/billing", () => {
    test("should reject request without authentication", async () => {
      const response = await request(app)
        .post("/api/billing")
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: appointment._id,
          consultationFee: 1000,
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should reject billing creation for doctor", async () => {
      const response = await request(app)
        .post("/api/billing")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: appointment._id,
          consultationFee: 1000,
        });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should reject request with missing patient, doctor or appointment", async () => {
      const response = await request(app)
        .post("/api/billing")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          consultationFee: 1000,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Patient, doctor and appointment are required"
      );
    });

    test("should reject billing when consultation fee is missing", async () => {
      const response = await request(app)
        .post("/api/billing")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: appointment._id,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Consultation fee is required"
      );
    });

    test("should reject billing for an invalid patient", async () => {
      const fakePatientId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post("/api/billing")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: fakePatientId,
          doctor: doctor._id,
          appointment: appointment._id,
          consultationFee: 1000,
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Active patient not found");
    });

    test("should reject billing for an invalid doctor", async () => {
      const fakeDoctorId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post("/api/billing")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patient._id,
          doctor: fakeDoctorId,
          appointment: appointment._id,
          consultationFee: 1000,
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Active doctor not found");
    });

    test("should reject billing for an invalid appointment", async () => {
      const fakeAppointmentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post("/api/billing")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: fakeAppointmentId,
          consultationFee: 1000,
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Appointment not found");
    });

    test("should reject billing when patient, doctor and appointment relationship does not match", async () => {
      const anotherPatient = await Patient.create({
        name: "Billing Another Patient",
        dateOfBirth: "1995-01-10",
        gender: "male",
        phone: "9200000020",
        email: `billing_another_${Date.now()}@clinic.com`,
        bloodGroup: "O+",
        createdBy: adminUser._id,
      });

      const response = await request(app)
        .post("/api/billing")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: anotherPatient._id,
          doctor: doctor._id,
          appointment: appointment._id,
          consultationFee: 1000,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Patient, doctor and appointment relationship does not match"
      );

      await Patient.findByIdAndDelete(anotherPatient._id);
    });

    test("should reject negative consultation fee", async () => {
      const response = await request(app)
        .post("/api/billing")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: appointment._id,
          consultationFee: -100,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Consultation fee cannot be negative"
      );
    });

    test("should reject negative additional charges, discount or tax", async () => {
      const response = await request(app)
        .post("/api/billing")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: appointment._id,
          consultationFee: 1000,
          additionalCharges: -50,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Additional charges, discount and tax cannot be negative"
      );
    });

    test("should reject negative paid amount", async () => {
      const response = await request(app)
        .post("/api/billing")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: appointment._id,
          consultationFee: 1000,
          paidAmount: -100,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Paid amount cannot be negative"
      );
    });

    test("should create billing successfully with correct total and pending status", async () => {
      const response = await request(app)
        .post("/api/billing")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: appointment._id,
          consultationFee: 1000,
          additionalCharges: 200,
          discount: 100,
          tax: 50,
          paidAmount: 0,
          paymentMethod: "cash",
          notes: "Primary billing test",
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.billing).toBeDefined();

      billing = response.body.data.billing;

      expect(billing.invoiceNumber).toMatch(/^INV-\d{5}$/);
      expect(billing.consultationFee).toBe(1000);
      expect(billing.additionalCharges).toBe(200);
      expect(billing.discount).toBe(100);
      expect(billing.tax).toBe(50);

      // 1000 + 200 - 100 + 50 = 1150
      expect(billing.totalAmount).toBe(1150);

      expect(billing.paidAmount).toBe(0);
      expect(billing.paymentStatus).toBe("pending");
      expect(billing.paymentMethod).toBe("cash");

      expect(billing.patient._id).toBe(patient._id.toString());
      expect(billing.doctor._id).toBe(doctor._id.toString());
      expect(billing.appointment._id).toBe(
        appointment._id.toString()
      );
    });

    test("should reject paid amount greater than total amount", async () => {
      const response = await request(app)
        .post("/api/billing")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: secondAppointment._id,
          consultationFee: 1000,
          paidAmount: 1001,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Paid amount cannot be greater than total amount"
      );
    });

    test("should reject total amount becoming negative", async () => {
      const response = await request(app)
        .post("/api/billing")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: secondAppointment._id,
          consultationFee: 100,
          discount: 200,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Total amount cannot be negative"
      );
    });

    test("should reject duplicate active billing for the same appointment", async () => {
      const response = await request(app)
        .post("/api/billing")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: appointment._id,
          consultationFee: 1000,
        });

      expect(response.statusCode).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Billing already exists for this appointment"
      );
    });

    test("should create billing successfully as receptionist", async () => {
      const response = await request(app)
        .post("/api/billing")
        .set("Authorization", `Bearer ${receptionistToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: secondAppointment._id,
          consultationFee: 1000,
          additionalCharges: 100,
          paidAmount: 500,
          paymentMethod: "upi",
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.billing).toBeDefined();

      const secondBillingId =
        response.body.data.billing._id;

      expect(
        response.body.data.billing.paymentStatus
      ).toBe("partial");

      expect(
        response.body.data.billing.totalAmount
      ).toBe(1100);

      await Billing.findByIdAndDelete(secondBillingId);
    });
  });

  describe("GET /api/billing", () => {
    test("should reject request without authentication", async () => {
      const response = await request(app).get("/api/billing");

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should allow admin to retrieve billing records", async () => {
      const response = await request(app)
        .get("/api/billing")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.billings).toBeDefined();
      expect(Array.isArray(response.body.data.billings)).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(1);
    });

    test("should allow doctor to retrieve billing records", async () => {
      const response = await request(app)
        .get("/api/billing")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.billings).toBeDefined();
    });

    test("should allow receptionist to retrieve billing records", async () => {
      const response = await request(app)
        .get("/api/billing")
        .set("Authorization", `Bearer ${receptionistToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.billings).toBeDefined();
    });
  });

  describe("GET /api/billing/:id", () => {
    test("should retrieve billing by ID", async () => {
      const response = await request(app)
        .get(`/api/billing/${billing._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.billing).toBeDefined();

      expect(response.body.data.billing._id).toBe(
        billing._id.toString()
      );
    });

    test("should return 404 for a non-existing billing record", async () => {
      const fakeBillingId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/billing/${fakeBillingId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Billing record not found"
      );
    });

    test("should allow receptionist to retrieve billing by ID", async () => {
      const response = await request(app)
        .get(`/api/billing/${billing._id}`)
        .set("Authorization", `Bearer ${receptionistToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.billing).toBeDefined();
    });
  });

  describe("GET /api/billing/patient/:patientId", () => {
    test("should reject request without authentication", async () => {
      const response = await request(app).get(
        `/api/billing/patient/${patient._id}`
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should retrieve patient billing history", async () => {
      const response = await request(app)
        .get(`/api/billing/patient/${patient._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.patient).toBeDefined();
      expect(response.body.data.billings).toBeDefined();
      expect(Array.isArray(response.body.data.billings)).toBe(true);

      expect(response.body.data.patient.name).toBe(
        "Billing Test Patient"
      );
      expect(response.body.count).toBeGreaterThanOrEqual(1);
    });

    test("should return 404 for a non-existing patient", async () => {
      const fakePatientId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/billing/patient/${fakePatientId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Active patient not found"
      );
    });

    test("should allow receptionist to view patient billing history", async () => {
      const response = await request(app)
        .get(`/api/billing/patient/${patient._id}`)
        .set("Authorization", `Bearer ${receptionistToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.billings).toBeDefined();
    });
  });

  describe("PUT /api/billing/:id", () => {
    test("should reject update without authentication", async () => {
      const response = await request(app)
        .put(`/api/billing/${billing._id}`)
        .send({
          additionalCharges: 300,
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should reject billing update for doctor", async () => {
      const response = await request(app)
        .put(`/api/billing/${billing._id}`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          additionalCharges: 300,
        });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should reject negative charges during update", async () => {
      const response = await request(app)
        .put(`/api/billing/${billing._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          additionalCharges: -100,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Charges, discount and tax cannot be negative"
      );
    });

    test("should reject paid amount greater than updated total", async () => {
      const response = await request(app)
        .put(`/api/billing/${billing._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          additionalCharges: 0,
          discount: 0,
          tax: 0,
          paidAmount: 2000,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Paid amount cannot be greater than total amount"
      );
    });

    test("should update billing successfully as receptionist", async () => {
      const response = await request(app)
        .put(`/api/billing/${billing._id}`)
        .set("Authorization", `Bearer ${receptionistToken}`)
        .send({
          additionalCharges: 300,
          discount: 50,
          tax: 100,
          paidAmount: 500,
          paymentMethod: "upi",
          notes: "Updated billing details",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.billing).toBeDefined();

      // 1000 + 300 - 50 + 100 = 1350
      expect(
        response.body.data.billing.totalAmount
      ).toBe(1350);

      expect(
        response.body.data.billing.paidAmount
      ).toBe(500);

      expect(
        response.body.data.billing.paymentStatus
      ).toBe("partial");

      expect(
        response.body.data.billing.paymentMethod
      ).toBe("upi");

      expect(
        response.body.data.billing.notes
      ).toBe("Updated billing details");
    });

    test("should update billing to paid status when paid amount equals total", async () => {
      const response = await request(app)
        .put(`/api/billing/${billing._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          paidAmount: 1350,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(
        response.body.data.billing.paymentStatus
      ).toBe("paid");

      expect(
        response.body.data.billing.paidAmount
      ).toBe(1350);
    });

    test("should return 404 when updating a non-existing billing record", async () => {
      const fakeBillingId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/billing/${fakeBillingId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          notes: "Does not exist",
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Billing record not found"
      );
    });
  });

  describe("DELETE /api/billing/:id", () => {
    test("should reject deletion without authentication", async () => {
      const response = await request(app).delete(
        `/api/billing/${billing._id}`
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should reject billing deactivation for doctor", async () => {
      const response = await request(app)
        .delete(`/api/billing/${billing._id}`)
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should reject billing deactivation for receptionist", async () => {
      const response = await request(app)
        .delete(`/api/billing/${billing._id}`)
        .set("Authorization", `Bearer ${receptionistToken}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should deactivate billing successfully as admin", async () => {
      const response = await request(app)
        .delete(`/api/billing/${billing._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Billing deactivated successfully"
      );

      const deactivatedBilling = await Billing.findById(
        billing._id
      );

      expect(deactivatedBilling).toBeDefined();
      expect(deactivatedBilling.isActive).toBe(false);
    });

    test("should not retrieve a deactivated billing record", async () => {
      const response = await request(app)
        .get(`/api/billing/${billing._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Billing record not found"
      );
    });

    test("should return 404 when deactivating a non-existing billing record", async () => {
      const fakeBillingId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/billing/${fakeBillingId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Billing record not found"
      );
    });
  });
});