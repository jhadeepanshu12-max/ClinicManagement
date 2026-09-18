const express = require("express");

const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  resetPassword,
  toggleUserStatus,
} = require("../controllers/userManagementController");

const {
  protect,
} = require("../middleware/authMiddleware");

const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorize("admin"));

router.get("/", getUsers);

router.get("/:id", getUserById);

router.post("/", createUser);

router.put("/:id", updateUser);

router.patch(
  "/:id/status",
  toggleUserStatus
);

router.patch(
  "/:id/reset-password",
  resetPassword
);

module.exports = router;