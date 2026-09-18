const express = require("express");

const {
  registerPatient,
} = require("../controllers/patientAuthController");

const router = express.Router();

router.post("/register", registerPatient);

module.exports = router;