const bcrypt = require("bcryptjs");

const User = require("../models/user");

const {
  getCurrentUser,
  updateProfile,
  changePassword,
} = require("../controllers/usercontroller");

describe("User Controller - Unit Tests", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      user: {
        _id: "user123",
        name: "Test Admin",
        email: "testadmin@clinic.com",
        phone: "9876543210",
        role: "admin",
        isActive: true,
      },
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe("getCurrentUser", () => {
    test("should return the authenticated user", async () => {
      await getCurrentUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Authenticated user retrieved successfully",
        data: {
          user: {
            id: "user123",
            name: "Test Admin",
            email: "testadmin@clinic.com",
            phone: "9876543210",
            role: "admin",
            isActive: true,
          },
        },
      });
    });
  });

  describe("updateProfile", () => {
    test("should reject request when name is missing", async () => {
      req.body = {
        phone: "9999999999",
      };

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Name is required",
      });
    });

    test("should update user profile successfully", async () => {
      const saveMock = jest.fn().mockResolvedValue();

      const mockUser = {
        _id: "user123",
        name: "Test Admin",
        email: "testadmin@clinic.com",
        phone: "9876543210",
        role: "admin",
        isActive: true,
        save: saveMock,
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      req.body = {
        name: "Updated Admin",
        phone: "9999999999",
      };

      await updateProfile(req, res);

      expect(User.findById).toHaveBeenCalledWith("user123");
      expect(mockUser.name).toBe("Updated Admin");
      expect(mockUser.phone).toBe("9999999999");
      expect(saveMock).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Profile updated successfully",
        })
      );
    });
  });

  describe("changePassword", () => {
    test("should reject request when current or new password is missing", async () => {
      req.body = {
        currentPassword: "",
        newPassword: "",
      };

      await changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Current password and new password are required",
      });
    });

    test("should reject a new password shorter than 6 characters", async () => {
      req.body = {
        currentPassword: "Test@12345",
        newPassword: "123",
      };

      await changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "New password must contain at least 6 characters",
      });
    });

    test("should reject incorrect current password", async () => {
      const mockUser = {
        _id: "user123",
        password: "hashed-password",
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      req.body = {
        currentPassword: "Wrong@12345",
        newPassword: "NewPass@123",
      };

      await changePassword(req, res);

      expect(mockUser.comparePassword).toHaveBeenCalledWith(
        "Wrong@12345"
      );

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Current password is incorrect",
      });
    });

    test("should reject when new password is same as current password", async () => {
      const mockUser = {
        _id: "user123",
        password: "hashed-password",
        comparePassword: jest
          .fn()
          .mockResolvedValueOnce(true)
          .mockResolvedValueOnce(true),
      };

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      req.body = {
        currentPassword: "Test@12345",
        newPassword: "Test@12345",
      };

      await changePassword(req, res);

      expect(mockUser.comparePassword).toHaveBeenNthCalledWith(
        1,
        "Test@12345"
      );

      expect(mockUser.comparePassword).toHaveBeenNthCalledWith(
        2,
        "Test@12345"
      );

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message:
          "New password must be different from the current password",
      });
    });

    test("should change password successfully", async () => {
      const oldPassword = "Test@12345";
      const newPassword = "NewPass@123";

      const hashedOldPassword = await bcrypt.hash(oldPassword, 10);

      const saveMock = jest.fn().mockImplementation(async function () {
        this.password = await bcrypt.hash(this.password, 10);
      });

      const mockUser = {
        _id: "user123",
        password: hashedOldPassword,
        comparePassword: jest
          .fn()
          .mockResolvedValueOnce(true)
          .mockResolvedValueOnce(false),
        save: saveMock,
      };

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      req.body = {
        currentPassword: oldPassword,
        newPassword,
      };

      await changePassword(req, res);

      expect(mockUser.comparePassword).toHaveBeenNthCalledWith(
        1,
        oldPassword
      );

      expect(mockUser.comparePassword).toHaveBeenNthCalledWith(
        2,
        newPassword
      );

      expect(saveMock).toHaveBeenCalled();

      expect(mockUser.password).not.toBe(newPassword);

      const passwordMatches = await bcrypt.compare(
        newPassword,
        mockUser.password
      );

      expect(passwordMatches).toBe(true);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Password changed successfully",
      });
    });
  });
});