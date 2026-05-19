//socket.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";

let io;

const onlineUsers = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie;

      if (!rawCookie) {
        return next(new Error("Authentication error"));
      }

      const cookies = cookie.parse(rawCookie);

      const token = cookies.token;

      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      socket.userId = decoded.id;

      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `Authenticated socket connected: ${socket.userId}`
    );

    // Automatically map authenticated user
    onlineUsers.set(String(socket.userId), socket.id);

    socket.on("joinRepo", (repoId) => {
      if (!repoId) return;

      socket.join(`repo_${repoId}`);

      console.log(
        `Socket ${socket.id} joined repo_${repoId}`
      );
    });

    socket.on("leaveRepo", (repoId) => {
      if (!repoId) return;

      socket.leave(`repo_${repoId}`);
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(String(socket.userId));

      console.log(
        `Socket disconnected: ${socket.userId}`
      );
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }

  return io;
};

export const getOnlineUsers = () => onlineUsers;