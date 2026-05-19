//activityRoute.js
import express from "express";
import { getRepoActivity } from "../controllers/activityController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import permissionMiddleware from "../middleware/permissionMiddleware.js";
import Repository from "../models/Repository.js";
import Activity from "../models/ActivityModel.js";

const router = express.Router();

const loadRepoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const repo = await Repository.findById(id);
    if (!repo) return res.status(404).json({ message: "Repository not found" });
    req.repo = repo;
    next();
  } catch (error) {
    next(error);
  }
};

// Require authentication and repo membership to see repo activity
router.get(
  "/repos/:id/activity",
  authMiddleware,
  loadRepoById,
  permissionMiddleware("viewer"),
  getRepoActivity
);
router.get(
  "/repos/:id/audit",
  authMiddleware,
  loadRepoById,
  permissionMiddleware("owner"),
  async (req, res, next) => {
    try {
      const auditLogs = await Activity.find({ repoId: req.params.id })
        .populate("userId", "username email")
        .sort({ createdAt: -1 })
        .limit(100);

      res.json({
        count: auditLogs.length,
        auditLogs,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;