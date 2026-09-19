const express = require("express");

const {
  getMyProfile,
  updateMyProfile,
} = require("../controllers/doctorProfileController");

const {
  protect,
} = require("../middleware/authMiddleware");

const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorize("doctor"));

router.get(
  "/me",
  getMyProfile
);

router.put(
  "/me",
  updateMyProfile
);

module.exports = router;