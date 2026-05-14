import { Server } from "socket.io";

let io;
const onlineUsers = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("register", (userId) => {
      if (!userId) return;
      onlineUsers.set(String(userId), socket.id);
      console.log(`User ${userId} registered`);
    });

    socket.on("joinRepo", (repoId) => {
      if (!repoId) return;
      socket.join(`repo_${repoId}`);
      console.log(`Socket ${socket.id} joined repo_${repoId}`);
    });

    socket.on("leaveRepo", (repoId) => {
      if (!repoId) return;
      socket.leave(`repo_${repoId}`);
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

export const getOnlineUsers = () => onlineUsers;