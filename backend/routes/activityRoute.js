import express from "express";
import { getRepoActivity } from "../controllers/activityController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import permissionMiddleware from "../middleware/permissionMiddleware.js";
import Repository from "../models/Repository.js";

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

export default router;