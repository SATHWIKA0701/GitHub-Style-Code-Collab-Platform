//prControllor.js
import * as prService from "../services/prService.js";
import PullRequest from "../models/PullRequest.js";
import * as gitService from "../services/gitService.js";
import { logActivity, notifyRepoMembers } from "../utils/eventHelpers.js";
import Repository from "../models/Repository.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";
import {
  emitRepoEvent,
} from "../utils/eventHelpers.js";

const hydratePR = (id) =>
  PullRequest.findById(id)
    .populate("createdBy", "_id username email")
    .populate("repoId", "_id name");

export const createPullRequest = asyncHandler(async (req, res) => {
  const { repoId, title, sourceBranch, targetBranch } = req.body || {};
  if (!repoId) return res.status(400).json({ message: "repoId is required" });
  if (!title || typeof title !== "string") return res.status(400).json({ message: "title is required" });
  if (!sourceBranch || typeof sourceBranch !== "string") return res.status(400).json({ message: "sourceBranch is required" });
  if (!targetBranch || typeof targetBranch !== "string") return res.status(400).json({ message: "targetBranch is required" });

  const pr = await prService.createPR({ ...req.body, createdBy: req.user.id });
  const repo = req.repo;
  if (repo) {
    await logActivity({ repoId: repo._id, userId: req.user.id, eventType: "pull_request_opened", message: `PR opened: ${pr.title}`, metadata: { prId: String(pr._id) } });
    await notifyRepoMembers({
  repo,
  excludeUserId: req.user.id,
  type: "new_pr",
  message: `New pull request in ${repo.name}: ${pr.title}`,
  payload: {
    type: "new_pr",
    prId: pr._id,
  },
  repoId: repo._id,
  resourceType: "pr",
  resourceId: pr._id,
});
  emitRepoEvent(
  repo._id,
  "repo_event",
  {
    type: "pull_request_opened",
    prId: pr._id,
    repoId: repo._id,
    title: pr.title,
  }
);
  }
  res.json(await hydratePR(pr._id));
});

export const getPullRequests = asyncHandler(async (req, res) => {
  const { repoId } = req.params;
  const { page, limit, skip } = getPagination(req.query);
  
  const { data, total } = await prService.getPRs(repoId, skip, limit);
  
  res.json({
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

export const getPullRequestById = asyncHandler(async (req, res) => {
  const pr = await hydratePR(req.params.prId);
  if (!pr) return res.status(404).json({ message: "Pull Request not found" });
  res.json(pr);
});

export const mergePullRequest = asyncHandler(async (req, res) => {
  const { prId } = req.params;

  const pr = await PullRequest.findById(prId);

  if (!pr) {
    return res.status(404).json({
      error: "Pull Request not found",
    });
  }

  if (pr.status === "merged") {
    return res.status(400).json({
      error: "PR already merged",
    });
  }

  const repo = await Repository.findById(pr.repoId);

  if (!repo) {
    return res.status(404).json({
      error: "Repository not found",
    });
  }

  await gitService.mergeBranch(
    repo.name,
    pr.sourceBranch,
    pr.targetBranch
  );

  pr.status = "merged";

  await pr.save();

  const hydratedRepo = req.repo;

  if (hydratedRepo) {
    await logActivity({
      repoId: hydratedRepo._id,
      userId: req.user.id,
      eventType: "pull_request_merged",
      message: `PR merged: ${pr.title}`,
      metadata: { prId: String(pr._id) },
    });

    await notifyRepoMembers({
  repo,
  excludeUserId: req.user.id,
  type: "pr_merged",
  message: `Pull request merged in ${repo.name}: ${pr.title}`,
  payload: {
    type: "pr_merged",
    prId: pr._id,
  },
  repoId: repo._id,
  resourceType: "pr",
  resourceId: pr._id,
});
emitRepoEvent(
  repo._id,
  "repo_event",
  {
    type: "pull_request_merged",
    prId: pr._id,
    repoId: repo._id,
    title: pr.title,
  }
);
  }

  res.json({
    message: "Pull Request merged successfully",
  });
});
