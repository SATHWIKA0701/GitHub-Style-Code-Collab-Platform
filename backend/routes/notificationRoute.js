import express from "express";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
} from "../controllers/notificationController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All notification routes require authentication
router.get(
  "/count",
  authMiddleware,
  getUnreadNotificationCount
);
router.get("/", authMiddleware, getMyNotifications);
router.patch("/:notificationId/read", authMiddleware, markNotificationRead);
router.put(
  "/read-all",
  authMiddleware,
  markAllNotificationsRead
);

export default router;