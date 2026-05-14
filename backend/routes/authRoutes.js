import express from "express";
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

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.get("/users/search", authMiddleware, searchUsers);
router.get("/users/:id", authMiddleware, getUserById);

export default router;
