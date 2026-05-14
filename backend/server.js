import http from "http";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import repoRoutes from "./routes/repoRoutes.js";
import issueRoutes from "./routes/issueRoutes.js";

import { initSocket } from "./config/socket.js";
import activityRoutes from "./routes/activityRoute.js";
import notificationRoutes from "./routes/notificationRoute.js";
import prRoutes from "./routes/prRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import gitRoutes from "./routes/gitRoutes.js";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const NODE_ENV = process.env.NODE_ENV || "development";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ✅ Security headers
app.use(helmet());

// ✅ CORS (only once, env-based)
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// ✅ Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(compression());

// ✅ Logging (reduced in production)
if (NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ✅ Basic rate limiting on API (especially auth)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});

app.use("/auth", apiLimiter);
app.use("/repos", apiLimiter);
app.use("/api", apiLimiter);

// ✅ Routes
app.use("/auth", authRoutes);
app.use("/repos", repoRoutes);
app.use("/", issueRoutes);
app.use("/api", activityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/pr", prRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/git", gitRoutes);

// ✅ Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    env: NODE_ENV,
  });
});

// ✅ Test route
app.get("/", (req, res) => {
  res.send("API Running");
});

// ✅ 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// ✅ Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);

  // Handle invalid JSON bodies from express.json()
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      message: "Invalid JSON body",
    });
  }

  // Mongoose model/schema errors
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      message: "Validation error",
      errors: Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      message: "Invalid value",
      field: err.path,
    });
  }

  // Duplicate key errors (e.g. unique index)
  if (err && typeof err === "object" && err.code === 11000) {
    return res.status(409).json({
      message: "Duplicate value",
    });
  }

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    message,
  });
});

// ✅ Server (strict port 3000 only)
const PORT = Number(process.env.PORT) || 3000;

const onServerStart = () => {
  console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`);
};

initSocket(server);

server.listen(PORT, onServerStart);

// If port is already in use, fail fast (no auto-increment)
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Close the process and restart`);
    process.exit(1);
  } else {
    console.error("Server failed:", error);
    process.exit(1);
  }
});