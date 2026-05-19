import express from "express";
import * as prController from "../controllers/prController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import permissionMiddleware from "../middleware/permissionMiddleware.js";
import Repository from "../models/Repository.js";
import PullRequest from "../models/PullRequest.js";
import archiveMiddleware from "../middleware/archiveMiddleware.js";

const router = express.Router();

const loadRepoFromBody = async (req, res, next) => {
  try {
    const { repoName } = req.body;
    if (!repoName) return res.status(400).json({ message: "repoName is required" });
    const repo = await Repository.findOne({ name: repoName });
    if (!repo) return res.status(404).json({ message: "Repository not found" });
    req.repo = repo;
    next();
  } catch (error) { next(error); }
};

const loadRepoFromPrId = async (req, res, next) => {
  try {
    const { prId } = req.params;
    const pr = await PullRequest.findById(prId);
    if (!pr) return res.status(404).json({ message: "Pull Request not found" });
    const repo = await Repository.findOne({ name: pr.repoName });
    if (!repo) return res.status(404).json({ message: "Repository not found for this PR" });
    req.repo = repo;
    next();
  } catch (error) { next(error); }
};

const loadRepoFromRepoNameParam = async (req, res, next) => {
  try {
    const { repoName } = req.params;
    if (!repoName) return res.status(400).json({ message: "repoName is required" });
    const repo = await Repository.findOne({ name: repoName });
    if (!repo) return res.status(404).json({ message: "Repository not found" });
    req.repo = repo;
    next();
  } catch (error) { next(error); }
};

router.post("/", authMiddleware, loadRepoFromBody, permissionMiddleware("collaborator"),archiveMiddleware, prController.createPullRequest);
router.get("/repo/:repoName", authMiddleware, loadRepoFromRepoNameParam, permissionMiddleware("viewer"), prController.getPullRequests);
router.get("/item/:prId", authMiddleware, loadRepoFromPrId, permissionMiddleware("viewer"), prController.getPullRequestById);
router.put("/:prId/merge", authMiddleware, loadRepoFromPrId, permissionMiddleware("owner"), archiveMiddleware, prController.mergePullRequest);

export default router;
