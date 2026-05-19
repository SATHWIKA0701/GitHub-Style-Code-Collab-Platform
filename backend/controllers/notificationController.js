import mongoose from "mongoose";
import Notification from "../models/NotificationModel.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";

export const getMyNotifications = asyncHandler(async (req, res) => {
    const { isRead } = req.query;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid authenticated user",
      });
    }

    const { page, limit, skip } = getPagination(req.query);
    const query = { userId };

    if (isRead !== undefined) {
      query.isRead = isRead === "true";
    } else {
      query.isRead = false;
    }

    const [data, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid authenticated user",
      });
    }

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (notification.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid authenticated user",
    });
  }

  const result = await Notification.updateMany(
    {
      userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
      },
    }
  );

  return res.status(200).json({
    success: true,
    message: "All notifications marked as read",
    modifiedCount: result.modifiedCount,
  });
});

export const getUnreadNotificationCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid authenticated user",
    });
  }

  const unread = await Notification.countDocuments({
    userId,
    isRead: false,
  });

  return res.status(200).json({
    success: true,
    unread,
  });
});