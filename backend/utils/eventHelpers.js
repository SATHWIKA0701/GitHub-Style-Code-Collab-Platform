import Activity from "../models/ActivityModel.js";
import Notification from "../models/NotificationModel.js";
import { getIO, getOnlineUsers } from "../config/socket.js";

export const logActivity = async ({
  repoId,
  userId,
  eventType,
  message,
  metadata = {},
}) => {
  return await Activity.create({
    repoId,
    userId,
    eventType,
    message,
    metadata,
  });
};

export const createNotification = async ({
  userId,
  message,
  type,
  repoId = null,

  resourceType = null,
  resourceId = null,
}) => {
  return await Notification.create({
    userId,
    message,
    type,
    repoId,

    resourceType,
    resourceId,
  });
};

export const emitRepoEvent = (
  repoId,
  eventName,
  payload
) => {
  const io = getIO();

  io.to(`repo_${repoId}`).emit(
    eventName,
    payload
  );
};

export const emitUserNotification = (userId, payload) => {
  const io = getIO();
  const onlineUsers = getOnlineUsers();
  const socketId = onlineUsers.get(String(userId));

  if (socketId) {
    io.to(socketId).emit("notification", payload);
  }
};

export const getRepoMemberUserIds = (repo) => {
  const ids = new Set();

  if (!repo) return [];

  if (repo.owner) ids.add(String(repo.owner));

  if (Array.isArray(repo.collaborators)) {
    for (const c of repo.collaborators) {
      if (c?.userId) ids.add(String(c.userId));
    }
  }

  return [...ids];
};

export const notifyRepoMembers = async ({
  repo,
  excludeUserId,
  type,
  message,
  payload,
  repoId,

  resourceType = null,
  resourceId = null,
}) => {
  const members = getRepoMemberUserIds(repo);

  const recipients = members.filter(
    (id) => id !== String(excludeUserId)
  );

  const effectiveRepoId =
    repoId || repo?._id || null;

  const notifications = await Promise.all(
    recipients.map((userId) =>
      createNotification({
        userId,
        message,
        type,
        repoId: effectiveRepoId,

        resourceType,
        resourceId,
      })
    )
  );

  recipients.forEach((userId, idx) => {
    emitUserNotification(userId, {
      type,
      message,
      notification: notifications[idx],
      ...(payload || {}),
    });
  });

  return notifications;
};