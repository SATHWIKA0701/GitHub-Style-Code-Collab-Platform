import express from "express";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validators/authValidators.js";
import { authLimiter } from "../middleware/rateLimiters.js";
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  searchUsers,
  getUserById,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", authMiddleware, logout);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.get("/users/search", authMiddleware, searchUsers);
router.get("/users/:id", authMiddleware, getUserById);

export default router;
