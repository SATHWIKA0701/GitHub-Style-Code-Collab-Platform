import express from "express";
import * as reviewController from "../controllers/reviewController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import permissionMiddleware from "../middleware/permissionMiddleware.js";
import PullRequest from "../models/PullRequest.js";
import Repository from "../models/Repository.js";

const router = express.Router();

// Loads repo via PR's normalized repoId reference (from route param :prId)
const loadRepoFromPrIdParam = async (req, res, next) => {
  try {
    const { prId } = req.params;

    const pr = await PullRequest.findById(prId);

    if (!pr) {
      return res.status(404).json({ message: "Pull Request not found" });
    }

    // Use normalized repoId reference instead of repoName
    const repo = await Repository.findById(pr.repoId);

    if (!repo) {
      return res.status(404).json({ message: "Repository not found for this PR" });
    }

    req.repo = repo;
    next();
  } catch (error) {
    next(error);
  }
};

// Loads repo via PR's normalized repoId reference (from request body prId)
const loadRepoFromPrIdBody = async (req, res, next) => {
  try {
    const { prId } = req.body;

    if (!prId) {
      return res.status(400).json({ message: "prId is required" });
    }

    const pr = await PullRequest.findById(prId);

    if (!pr) {
      return res.status(404).json({ message: "Pull Request not found" });
    }

    // Use normalized repoId reference instead of repoName
    const repo = await Repository.findById(pr.repoId);

    if (!repo) {
      return res.status(404).json({ message: "Repository not found for this PR" });
    }

    req.repo = repo;
    next();
  } catch (error) {
    next(error);
  }
};

// Only collaborators/owner can add review comments
router.post(
  "/comment",
  authMiddleware,
  loadRepoFromPrIdBody,
  permissionMiddleware("collaborator"),
  reviewController.addReviewComment
);

// Any repo member (viewer/collaborator/owner) can view review comments
router.get(
  "/:prId",
  authMiddleware,
  loadRepoFromPrIdParam,
  permissionMiddleware("viewer"),
  reviewController.getReviewComments
);

export default router;