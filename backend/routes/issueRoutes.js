import express from "express";
import {
  createIssue,
  getIssuesByRepo,
  addComment,
  getCommentsByIssue,
  closeIssue,
} from "../controllers/issueController.js";

import authMiddleware from "../middleware/authMiddleware.js"; // ✅ ADD THIS
import permissionMiddleware from "../middleware/permissionMiddleware.js";
import Repository from "../models/Repository.js";
import Issue from "../models/Issue.js";

const router = express.Router();

const loadRepoFromRepoIdParam = async (req, res, next) => {
  try {
    const { id } = req.params; // repoId
    const repo = await Repository.findById(id);
    if (!repo) {
      return res.status(404).json({ message: "Repository not found" });
    }
    req.repo = repo;
    next();
  } catch (error) {
    next(error);
  }
};

const loadIssueAndRepoFromIssueIdParam = async (req, res, next) => {
  try {
    const { id } = req.params; // issueId
    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const repo = await Repository.findById(issue.repoId);
    if (!repo) {
      return res.status(404).json({ message: "Repository not found" });
    }

    req.issue = issue;
    req.repo = repo;
    next();
  } catch (error) {
    next(error);
  }
};

// 🔒 Protected routes
router.post(
  "/repos/:id/issues",
  authMiddleware,
  loadRepoFromRepoIdParam,
  permissionMiddleware("collaborator"),
  createIssue
);
router.post(
  "/issues/:id/comments",
  authMiddleware,
  loadIssueAndRepoFromIssueIdParam,
  permissionMiddleware("collaborator"),
  addComment
);
router.put(
  "/issues/:id/close",
  authMiddleware,
  loadIssueAndRepoFromIssueIdParam,
  permissionMiddleware("viewer"),
  closeIssue
);

// 🔒 Protected reads
router.get(
  "/repos/:id/issues",
  authMiddleware,
  loadRepoFromRepoIdParam,
  permissionMiddleware("viewer"),
  getIssuesByRepo
);
router.get(
  "/issues/:id/comments",
  authMiddleware,
  loadIssueAndRepoFromIssueIdParam,
  permissionMiddleware("viewer"),
  getCommentsByIssue
);

export default router;