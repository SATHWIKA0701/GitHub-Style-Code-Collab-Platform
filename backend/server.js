import http from "http";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import { apiLimiter } from "./middleware/rateLimiters.js";

import authRoutes from "./routes/authRoutes.js";
import repoRoutes from "./routes/repoRoutes.js";
import issueRoutes from "./routes/issueRoutes.js";

import { initSocket } from "./config/socket.js";
import { execSync } from "child_process";
import activityRoutes from "./routes/activityRoute.js";
import notificationRoutes from "./routes/notificationRoute.js";
import prRoutes from "./routes/prRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import gitRoutes from "./routes/gitRoutes.js";
import invitationRoutes from "./routes/invitationRoutes.js";

dotenv.config();
connectDB();

const runtimeEnv =
  globalThis.processEnv && typeof globalThis.processEnv === "object"
    ? globalThis.processEnv
    : process.env;

const app = express();
const server = http.createServer(app);

const NODE_ENV = runtimeEnv.NODE_ENV || "development";
const CLIENT_URL = runtimeEnv.CLIENT_URL || "http://localhost:5173";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", CLIENT_URL],
      },
    },
  })
);

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(compression());

app.use(apiLimiter);

if (NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

app.use("/auth", authRoutes);
app.use("/repos", repoRoutes);
app.use("/", issueRoutes);
app.use("/api", activityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", invitationRoutes);
app.use("/api/pr", prRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/git", gitRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    env: NODE_ENV,
  });
});

app.get("/", (req, res) => {
  res.send("API Running");
});

app.use((req, res, next) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      message: "Invalid JSON body",
    });
  }

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
const PORT = Number(runtimeEnv.PORT) || 3000;

const onServerStart = () => {
  console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`);
};

initSocket(server);

function killProcessOnPort(port) {
  try {
    const out = execSync(`lsof -ti tcp:${port}`).toString().trim();
    if (!out) return [];
    const pids = out.split(/\s+/).filter(Boolean);
    if (pids.length) {
      console.log(`Killing process(es) on port ${port}: ${pids.join(", ")}`);
      execSync(`kill -9 ${pids.join(" ")}`);
    }
    return pids;
  } catch (err) {
    // lsof returns non-zero if no process found — ignore
    return [];
  }
}

async function startServerWithPortKill(port, retries = 1) {
  return new Promise((resolve, reject) => {
    server.listen(port, () => {
      onServerStart();
      resolve();
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.warn(`Port ${port} is already in use. Attempting to free it.`);
        if (retries > 0) {
          const killed = killProcessOnPort(port);
          if (killed.length) {
            // wait a short moment then retry
            setTimeout(() => {
              startServerWithPortKill(port, retries - 1).then(resolve).catch(reject);
            }, 500);
            return;
          }
        }
        reject(new Error(`Port ${port} is already in use and could not be freed`));
      } else {
        reject(error);
      }
    });
  });
}

(async () => {
  try {
    await startServerWithPortKill(PORT, 1);
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
})();