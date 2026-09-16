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
const Prescription = require("../models/prescription");

describe("Prescription API - Integration Tests", () => {
  let adminUser;
  let doctorUser;
  let receptionistUser;

  let patient;
  let doctor;
  let appointment;
  let secondAppointment;

  let medicalRecord;
  let secondMedicalRecord;

  let prescription;

  let adminToken;
  let doctorToken;
  let receptionistToken;

  beforeAll(async () => {
    await connectDB();

    adminUser = await User.create({
      name: "Prescription Test Admin",
      email: `prescription_admin_${Date.now()}@clinic.com`,
      phone: "9100000001",
      password: "Admin@12345",
      role: "admin",
    });

    doctorUser = await User.create({
      name: "Prescription Test Doctor",
      email: `prescription_doctor_${Date.now()}@clinic.com`,
      phone: "9100000002",
      password: "Doctor@12345",
      role: "doctor",
    });

    receptionistUser = await User.create({
      name: "Prescription Test Receptionist",
      email: `prescription_receptionist_${Date.now()}@clinic.com`,
      phone: "9100000003",
      password: "Reception@12345",
      role: "receptionist",
    });

    doctor = await Doctor.create({
      user: doctorUser._id,
      specialization: "General Medicine",
      qualification: "MBBS",
      licenseNumber: `PRES-LIC-${Date.now()}`,
      experience: 6,
      consultationFee: 900,
      availableDays: ["monday", "tuesday", "wednesday"],
      availability: {
        startTime: "09:00",
        endTime: "17:00",
      },
      department: "General Medicine",
      bio: "Prescription integration test doctor",
    });

    patient = await Patient.create({
      name: "Prescription Test Patient",
      dateOfBirth: "1999-06-20",
      gender: "male",
      phone: "9100000010",
      email: `prescription_patient_${Date.now()}@clinic.com`,
      address: "Prescription Test Address",
      bloodGroup: "B+",
      medicalHistory: "No major medical history",
      allergies: ["Penicillin"],
      notes: "Prescription integration test patient",
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
      appointmentDate: new Date("2035-08-10"),
      appointmentTime: "10:00",
      reason: "Fever and cold",
      consultationFee: 900,
      notes: "Prescription primary appointment",
      createdBy: adminUser._id,
    });

    secondAppointment = await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      appointmentDate: new Date("2035-08-11"),
      appointmentTime: "11:00",
      reason: "Stomach pain",
      consultationFee: 900,
      notes: "Prescription secondary appointment",
      createdBy: adminUser._id,
    });

    medicalRecord = await MedicalRecord.create({
      patient: patient._id,
      doctor: doctor._id,
      appointment: appointment._id,
      visitDate: new Date("2035-08-10"),
      chiefComplaint: "Fever and cold",
      symptoms: ["Fever", "Cold", "Cough"],
      vitals: {
        temperature: 100.4,
        bloodPressure: "120/80",
        heartRate: 82,
        respiratoryRate: 18,
        oxygenSaturation: 98,
        weight: 70,
        height: 172,
      },
      diagnosis: "Viral infection",
      treatmentPlan: "Symptomatic treatment",
      clinicalNotes: "Patient advised rest and hydration",
      createdBy: adminUser._id,
    });

    secondMedicalRecord = await MedicalRecord.create({
      patient: patient._id,
      doctor: doctor._id,
      appointment: secondAppointment._id,
      visitDate: new Date("2035-08-11"),
      chiefComplaint: "Stomach pain",
      symptoms: ["Abdominal pain"],
      diagnosis: "Gastritis",
      treatmentPlan: "Medication and dietary precautions",
      clinicalNotes: "Follow-up if symptoms persist",
      createdBy: adminUser._id,
    });
  });

  afterAll(async () => {
    await Prescription.deleteMany({
      $or: [
        { _id: prescription?._id },
      ],
    });

    if (appointment?._id) {
      await Appointment.findByIdAndDelete(appointment._id);
    }

    if (secondAppointment?._id) {
      await Appointment.findByIdAndDelete(secondAppointment._id);
    }

    if (medicalRecord?._id) {
      await MedicalRecord.findByIdAndDelete(medicalRecord._id);
    }

    if (secondMedicalRecord?._id) {
      await MedicalRecord.findByIdAndDelete(secondMedicalRecord._id);
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

  const medicine = {
    name: "Paracetamol",
    dosage: "500 mg",
    frequency: "Twice daily",
    duration: "5 days",
    route: "Oral",
    instructions: "Take after meals",
  };

  describe("POST /api/prescriptions", () => {
    test("should reject request without authentication", async () => {
      const response = await request(app)
        .post("/api/prescriptions")
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: appointment._id,
          medicalRecord: medicalRecord._id,
          medicines: [medicine],
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should reject prescription creation for receptionist", async () => {
      const response = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${receptionistToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: appointment._id,
          medicalRecord: medicalRecord._id,
          medicines: [medicine],
        });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should reject request with missing required fields", async () => {
      const response = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: appointment._id,
          medicalRecord: medicalRecord._id,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should reject prescription with an empty medicines array", async () => {
      const response = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: appointment._id,
          medicalRecord: medicalRecord._id,
          medicines: [],
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should reject prescription for an invalid patient", async () => {
      const fakePatientId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: fakePatientId,
          doctor: doctor._id,
          appointment: appointment._id,
          medicalRecord: medicalRecord._id,
          medicines: [medicine],
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Active patient not found");
    });

    test("should reject prescription for an invalid doctor", async () => {
      const fakeDoctorId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patient._id,
          doctor: fakeDoctorId,
          appointment: appointment._id,
          medicalRecord: medicalRecord._id,
          medicines: [medicine],
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Active doctor not found");
    });

    test("should reject prescription for an invalid appointment", async () => {
      const fakeAppointmentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: fakeAppointmentId,
          medicalRecord: medicalRecord._id,
          medicines: [medicine],
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Appointment not found");
    });

    test("should reject prescription for an invalid medical record", async () => {
      const fakeMedicalRecordId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: appointment._id,
          medicalRecord: fakeMedicalRecordId,
          medicines: [medicine],
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Medical record not found");
    });

    test("should reject when appointment does not belong to selected patient and doctor", async () => {
      const anotherPatient = await Patient.create({
        name: "Prescription Another Patient",
        dateOfBirth: "1997-01-15",
        gender: "female",
        phone: "9100000020",
        email: `prescription_another_${Date.now()}@clinic.com`,
        bloodGroup: "A+",
        createdBy: adminUser._id,
      });

      const response = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: anotherPatient._id,
          doctor: doctor._id,
          appointment: appointment._id,
          medicalRecord: medicalRecord._id,
          medicines: [medicine],
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Appointment does not belong to the selected patient and doctor"
      );

      await Patient.findByIdAndDelete(anotherPatient._id);
    });

    test("should reject when medical record does not belong to selected patient, doctor and appointment", async () => {
      const response = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: appointment._id,
          medicalRecord: secondMedicalRecord._id,
          medicines: [medicine],
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Medical record does not belong to the selected patient, doctor and appointment"
      );
    });

    test("should create a prescription successfully as admin", async () => {
      const response = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: appointment._id,
          medicalRecord: medicalRecord._id,
          prescriptionDate: "2035-08-10",
          medicines: [medicine],
          generalInstructions: "Drink plenty of water",
          advice: "Take adequate rest",
          followUpDate: "2035-08-17",
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.prescription).toBeDefined();

      prescription = response.body.data.prescription;

      expect(prescription.patient._id).toBe(
        patient._id.toString()
      );
      expect(prescription.doctor._id).toBe(
        doctor._id.toString()
      );
      expect(prescription.appointment._id).toBe(
        appointment._id.toString()
      );
      expect(prescription.medicalRecord._id).toBe(
        medicalRecord._id.toString()
      );

      expect(prescription.medicines).toHaveLength(1);
      expect(prescription.medicines[0].name).toBe("Paracetamol");
      expect(prescription.medicines[0].dosage).toBe("500 mg");
      expect(prescription.generalInstructions).toBe(
        "Drink plenty of water"
      );
    });

    test("should reject duplicate active prescription for the same appointment", async () => {
      const response = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: appointment._id,
          medicalRecord: medicalRecord._id,
          medicines: [medicine],
        });

      expect(response.statusCode).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "An active prescription already exists for this appointment"
      );
    });

    test("should create a prescription successfully as doctor", async () => {
      const response = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          patient: patient._id,
          doctor: doctor._id,
          appointment: secondAppointment._id,
          medicalRecord: secondMedicalRecord._id,
          prescriptionDate: "2035-08-11",
          medicines: [
            {
              name: "Omeprazole",
              dosage: "20 mg",
              frequency: "Once daily",
              duration: "14 days",
              route: "Oral",
              instructions: "Take before breakfast",
            },
          ],
          generalInstructions: "Avoid spicy food",
          advice: "Maintain a light diet",
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.prescription).toBeDefined();

      const secondPrescriptionId =
        response.body.data.prescription._id;

      const secondPrescription = await Prescription.findById(
        secondPrescriptionId
      );

      expect(secondPrescription).toBeDefined();
      expect(secondPrescription.medicines).toHaveLength(1);
      expect(secondPrescription.medicines[0].name).toBe(
        "Omeprazole"
      );

      await Prescription.findByIdAndDelete(secondPrescriptionId);
    });
  });

  describe("GET /api/prescriptions", () => {
    test("should reject request without authentication", async () => {
      const response = await request(app).get(
        "/api/prescriptions"
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should allow admin to retrieve prescriptions", async () => {
      const response = await request(app)
        .get("/api/prescriptions")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.prescriptions).toBeDefined();
      expect(
        Array.isArray(response.body.data.prescriptions)
      ).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(1);
    });

    test("should allow doctor to retrieve prescriptions", async () => {
      const response = await request(app)
        .get("/api/prescriptions")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.prescriptions).toBeDefined();
    });

    test("should allow receptionist to retrieve prescriptions", async () => {
      const response = await request(app)
        .get("/api/prescriptions")
        .set("Authorization", `Bearer ${receptionistToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.prescriptions).toBeDefined();
    });
  });

  describe("GET /api/prescriptions/:id", () => {
    test("should retrieve prescription by ID", async () => {
      const response = await request(app)
        .get(`/api/prescriptions/${prescription._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.prescription).toBeDefined();
      expect(
        response.body.data.prescription._id
      ).toBe(prescription._id.toString());
    });

    test("should return 404 for a non-existing prescription", async () => {
      const fakePrescriptionId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/prescriptions/${fakePrescriptionId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Prescription not found"
      );
    });

    test("should allow receptionist to retrieve prescription", async () => {
      const response = await request(app)
        .get(`/api/prescriptions/${prescription._id}`)
        .set("Authorization", `Bearer ${receptionistToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.prescription).toBeDefined();
    });
  });

  describe("GET /api/prescriptions/patient/:patientId", () => {
    test("should reject request without authentication", async () => {
      const response = await request(app).get(
        `/api/prescriptions/patient/${patient._id}`
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should retrieve patient prescription history", async () => {
      const response = await request(app)
        .get(`/api/prescriptions/patient/${patient._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.patient).toBeDefined();
      expect(response.body.data.prescriptions).toBeDefined();
      expect(
        Array.isArray(response.body.data.prescriptions)
      ).toBe(true);

      expect(response.body.data.patient.name).toBe(
        "Prescription Test Patient"
      );
      expect(response.body.count).toBeGreaterThanOrEqual(1);
    });

    test("should return 404 for a non-existing patient", async () => {
      const fakePatientId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/prescriptions/patient/${fakePatientId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Active patient not found"
      );
    });

    test("should allow receptionist to view patient prescription history", async () => {
      const response = await request(app)
        .get(`/api/prescriptions/patient/${patient._id}`)
        .set("Authorization", `Bearer ${receptionistToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.prescriptions).toBeDefined();
    });
  });

  describe("PUT /api/prescriptions/:id", () => {
    test("should reject update without authentication", async () => {
      const response = await request(app)
        .put(`/api/prescriptions/${prescription._id}`)
        .send({
          medicines: [medicine],
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should reject prescription update for receptionist", async () => {
      const response = await request(app)
        .put(`/api/prescriptions/${prescription._id}`)
        .set("Authorization", `Bearer ${receptionistToken}`)
        .send({
          medicines: [medicine],
        });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should reject update with an empty medicines array", async () => {
      const response = await request(app)
        .put(`/api/prescriptions/${prescription._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          medicines: [],
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Prescription must contain at least one medicine"
      );
    });

    test("should update prescription successfully as doctor", async () => {
      const response = await request(app)
        .put(`/api/prescriptions/${prescription._id}`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          medicines: [
            {
              name: "Paracetamol",
              dosage: "650 mg",
              frequency: "Three times daily",
              duration: "3 days",
              route: "Oral",
              instructions: "Take after food",
            },
            {
              name: "Cetirizine",
              dosage: "10 mg",
              frequency: "Once daily",
              duration: "5 days",
              route: "Oral",
              instructions: "Take at night",
            },
          ],
          generalInstructions: "Updated instructions",
          advice: "Updated advice",
          followUpDate: "2035-08-20",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.prescription).toBeDefined();

      expect(
        response.body.data.prescription.medicines
      ).toHaveLength(2);

      expect(
        response.body.data.prescription.medicines[0].dosage
      ).toBe("650 mg");

      expect(
        response.body.data.prescription.generalInstructions
      ).toBe("Updated instructions");
    });

    test("should update prescription successfully as admin", async () => {
      const response = await request(app)
        .put(`/api/prescriptions/${prescription._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          advice: "Final updated advice",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(
        response.body.data.prescription.advice
      ).toBe("Final updated advice");
    });

    test("should return 404 when updating a non-existing prescription", async () => {
      const fakePrescriptionId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/prescriptions/${fakePrescriptionId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          advice: "Does not exist",
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Prescription not found"
      );
    });
  });

  describe("DELETE /api/prescriptions/:id", () => {
    test("should reject deletion without authentication", async () => {
      const response = await request(app).delete(
        `/api/prescriptions/${prescription._id}`
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should reject prescription deletion for receptionist", async () => {
      const response = await request(app)
        .delete(`/api/prescriptions/${prescription._id}`)
        .set("Authorization", `Bearer ${receptionistToken}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should deactivate prescription successfully as doctor", async () => {
      const response = await request(app)
        .delete(`/api/prescriptions/${prescription._id}`)
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Prescription deactivated successfully"
      );

      const deactivatedPrescription =
        await Prescription.findById(prescription._id);

      expect(deactivatedPrescription).toBeDefined();
      expect(deactivatedPrescription.isActive).toBe(false);
    });

    test("should return 404 when deleting a non-existing prescription", async () => {
      const fakePrescriptionId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/prescriptions/${fakePrescriptionId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Prescription not found"
      );
    });
  });
});