import express from "express";
import * as prController from "../controllers/prController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import permissionMiddleware from "../middleware/permissionMiddleware.js";
import Repository from "../models/Repository.js";
import PullRequest from "../models/PullRequest.js";

const router = express.Router();

// Loads repo from repoId in request body (used for PR creation)
const loadRepoFromRepoIdBody = async (req, res, next) => {
  try {
    const { repoId } = req.body;
    if (!repoId) return res.status(400).json({ message: "repoId is required" });
    const repo = await Repository.findById(repoId);
    if (!repo) return res.status(404).json({ message: "Repository not found" });
    req.repo = repo;
    next();
  } catch (error) { next(error); }
};

// Loads repo via PR's repoId reference (used for PR detail/merge)
const loadRepoFromPrId = async (req, res, next) => {
  try {
    const { prId } = req.params;
    const pr = await PullRequest.findById(prId);
    if (!pr) return res.status(404).json({ message: "Pull Request not found" });
    const repo = await Repository.findById(pr.repoId);
    if (!repo) return res.status(404).json({ message: "Repository not found for this PR" });
    req.repo = repo;
    next();
  } catch (error) { next(error); }
};

// Loads repo from repoId route parameter (used for PR listing)
const loadRepoFromRepoIdParam = async (req, res, next) => {
  try {
    const { repoId } = req.params;
    if (!repoId) return res.status(400).json({ message: "repoId is required" });
    const repo = await Repository.findById(repoId);
    if (!repo) return res.status(404).json({ message: "Repository not found" });
    req.repo = repo;
    next();
  } catch (error) { next(error); }
};

router.post("/", authMiddleware, loadRepoFromRepoIdBody, permissionMiddleware("collaborator"), prController.createPullRequest);
router.get("/repository/:repoId", authMiddleware, loadRepoFromRepoIdParam, permissionMiddleware("viewer"), prController.getPullRequests);
router.get("/item/:prId", authMiddleware, loadRepoFromPrId, permissionMiddleware("viewer"), prController.getPullRequestById);
router.put("/:prId/merge", authMiddleware, loadRepoFromPrId, permissionMiddleware("owner"), prController.mergePullRequest);

export default router;
