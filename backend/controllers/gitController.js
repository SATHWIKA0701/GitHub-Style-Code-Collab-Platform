import * as gitService from "../services/gitService.js";
import { logActivity, notifyRepoMembers } from "../utils/eventHelpers.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";

export const createRepo = asyncHandler(async (req, res) => {
  const { repoName, defaultBranch } = req.body;
  const repoPath = await gitService.initRepository(
    repoName,
    defaultBranch || "main"
  );

  res.json({ repoPath });
});

export const commit = asyncHandler(async (req, res) => {
  const { repoName, message } = req.body;
  const result = await gitService.commitFiles(repoName, message);
  const repo = req.repo;

  if (repo) {
    await logActivity({
      repoId: repo._id,
      userId: req.user.id,
      eventType: "commit_pushed",
      message: `Commit pushed to ${repo.name}`,
      metadata: {
        commit: result?.commit || null,
      },
    });

    await notifyRepoMembers({
      repo,
      excludeUserId: req.user.id,
      type: "commit_pushed",
      message: `New commit pushed in ${repo.name}`,
      payload: {
        type: "commit_pushed",
        message: `New commit in ${repo.name}`,
      },
      repoId: repo._id,
    });
  }

  res.json(result);
});

export const getCommits = asyncHandler(async (req, res) => {
  const { repoName } = req.params;
  const { page, limit, skip } = getPagination(req.query);

  const { data, total } = await gitService.getCommitHistory(
    repoName,
    skip,
    limit
  );

  res.json({
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  });
});

export const createBranch = asyncHandler(async (req, res) => {
  const { repoName, branchName } = req.body;
  const result = await gitService.createBranch(repoName, branchName);

  if (req.repo) {
    await logActivity({
      repoId: req.repo._id,
      userId: req.user.id,
      eventType: "branch_created",
      message: "Branch created",
      metadata: { branchName },
    });
  }

  res.json(result);
});

export const switchBranch = asyncHandler(async (req, res) => {
  const result = await gitService.switchBranch(
    req.body.repoName,
    req.body.branchName
  );

  res.json(result);
});

export const mergeBranch = asyncHandler(async (req, res) => {
  const result = await gitService.mergeBranch(
    req.body.repoName,
    req.body.branchName
  );

  if (req.repo) {
    await logActivity({
      repoId: req.repo._id,
      userId: req.user.id,
      eventType: "commit_pushed",
      message: "Branches merged",
      metadata: {
        mergedBranch: req.body.branchName,
      },
    });
  }

  res.json(result);
});

export const getPRDiff = asyncHandler(async (req, res) => {
  const { repoName, sourceBranch, targetBranch } = req.query;

  if (!repoName || !sourceBranch || !targetBranch) {
    return res.status(400).json({
      error: "repoName, sourceBranch and targetBranch are required",
    });
  }

  const diff = await gitService.getBranchDiff(
    repoName,
    sourceBranch,
    targetBranch
  );

  res.json({ diff });
});

export const getBranches = asyncHandler(async (req, res) => {
  const branches = await gitService.getBranches(req.params.repoName);
  res.json(branches);
});

export const getCommitGraph = asyncHandler(async (req, res) => {
  const graph = await gitService.getCommitGraph(req.params.repoName);
  res.json({ graph });
});

export const getFiles = asyncHandler(async (req, res) => {
  const files = await gitService.listFiles(
    req.params.repoName,
    req.query.path || ""
  );

  res.json(files);
});

export const saveFile = asyncHandler(async (req, res) => {
  const result = await gitService.writeFileContent(
    req.body.repoName,
    req.body.path,
    req.body.content || ""
  );

  res.json(result);
});

export const uploadFiles = asyncHandler(async (req, res) => {
  const uploaded = await gitService.uploadFiles(
    req.body.repoName,
    req.files || [],
    req.body.directory || ""
  );

  res.json({ uploaded });
});

export const createFolder = asyncHandler(async (req, res) => {
  const result = await gitService.createFolder(
    req.body.repoName,
    req.body.path
  );

  res.json(result);
});

export const deleteFilePath = asyncHandler(async (req, res) => {
  const result = await gitService.deletePath(
    req.body.repoName,
    req.body.path
  );

  res.json(result);
});