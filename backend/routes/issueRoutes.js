import express from "express";
import {
  createIssue,
  getIssuesByRepo,
  addComment,
  getCommentsByIssue,
  closeIssue,
  getIssueById,
  updateIssue,
  reopenIssue,
  deleteComment,
} from "../controllers/issueController.js";
import {
  getLabels,
  createLabel,
  updateLabel,
  deleteLabel,
} from "../controllers/labelController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import permissionMiddleware from "../middleware/permissionMiddleware.js";
import Repository from "../models/Repository.js";
import Issue from "../models/Issue.js";
import archiveMiddleware from "../middleware/archiveMiddleware.js";

const router = express.Router();

const loadRepoFromRepoIdParam = async (req, res, next) => {
  try {
    const { id } = req.params;
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
    const issueId = req.params.issueId || req.params.id;
    const issue = await Issue.findById(issueId);
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

// Labels (repo-scoped)
router.get("/repos/:id/labels", authMiddleware, loadRepoFromRepoIdParam, permissionMiddleware("viewer"), getLabels);
router.post("/repos/:id/labels", authMiddleware, loadRepoFromRepoIdParam, permissionMiddleware("collaborator"), archiveMiddleware, createLabel);
router.put("/repos/:id/labels/:labelId", authMiddleware, loadRepoFromRepoIdParam, permissionMiddleware("collaborator"), archiveMiddleware, updateLabel);
router.delete("/repos/:id/labels/:labelId", authMiddleware, loadRepoFromRepoIdParam, permissionMiddleware("collaborator"), archiveMiddleware, deleteLabel);

// Protected routes
router.post(
  "/repos/:id/issues",
  authMiddleware,
  loadRepoFromRepoIdParam,
  permissionMiddleware("viewer"),
  archiveMiddleware,
  createIssue
);
router.put(
  "/issues/:id",
  authMiddleware,
  loadIssueAndRepoFromIssueIdParam,
  permissionMiddleware("collaborator"),
  archiveMiddleware,
  updateIssue
);
router.post(
  "/issues/:id/comments",
  authMiddleware,
  loadIssueAndRepoFromIssueIdParam,
  permissionMiddleware("viewer"),
  archiveMiddleware,
  addComment
);
router.put(
  "/issues/:id/close",
  authMiddleware,
  loadIssueAndRepoFromIssueIdParam,
  permissionMiddleware("collaborator"),
  archiveMiddleware,
  closeIssue
);
router.put(
  "/issues/:id/reopen",
  authMiddleware,
  loadIssueAndRepoFromIssueIdParam,
  permissionMiddleware("collaborator"),
  archiveMiddleware,
  reopenIssue
);
router.delete(
  "/issues/:issueId/comments/:commentId",
  authMiddleware,
  deleteComment
);

// Protected reads
router.get(
  "/repos/:id/issues",
  authMiddleware,
  loadRepoFromRepoIdParam,
  permissionMiddleware("viewer"),
  getIssuesByRepo
);
router.get(
  "/issues/:id",
  authMiddleware,
  loadIssueAndRepoFromIssueIdParam,
  permissionMiddleware("viewer"),
  getIssueById
);
router.get(
  "/issues/:id/comments",
  authMiddleware,
  loadIssueAndRepoFromIssueIdParam,
  permissionMiddleware("viewer"),
  getCommentsByIssue
);

export default router;