import express from "express";
import {
  getMyNotifications,
  markNotificationRead,
} from "../controllers/notificationController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All notification routes require authentication
router.get("/", authMiddleware, getMyNotifications);
router.patch("/:notificationId/read", authMiddleware, markNotificationRead);

export default router;