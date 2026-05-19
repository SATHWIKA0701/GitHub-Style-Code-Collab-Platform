import * as gitService from "../services/gitService.js";
import { logActivity, notifyRepoMembers } from "../utils/eventHelpers.js";

export const createRepo = async (req, res) => {
  const { repoName, defaultBranch } = req.body;
  const repoPath = await gitService.initRepository(repoName, defaultBranch || "main");
  res.json({ repoPath });
};

export const commit = async (req, res) => {
  const { repoName, message } = req.body;
  const result = await gitService.commitFiles(repoName, message, req.user);
  const repo = req.repo;

  if (repo) {
    await logActivity({
      repoId: repo._id,
      userId: req.user.id,
      eventType: "commit_pushed",
      message: `Commit pushed to ${repo.name}`,
      metadata: {
        commit: result?.commit || null,
        sha: result?.commit || null,
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
        sha: result?.commit || null,
      },
      repoId: repo._id,
    });
  }

  res.json(result);
};

export const getCommits = async (req, res) => {
  const result = await gitService.getCommitHistory(
    req.params.repoName,
    req.query.branch || null
  );

  res.json(result);
};

export const getStructuredCommits = async (req, res) => {
  const result = await gitService.getStructuredCommits(req.params.repoName);
  res.json(result);
};

export const getCommitDetails = async (req, res) => {
  const diff = await gitService.getCommitDetails(
    req.params.repoName,
    req.params.sha
  );

  res.json({ diff });
};

export const createBranch = async (req, res) => {
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
};

export const switchBranch = async (req, res) => {
  const result = await gitService.switchBranch(
    req.body.repoName,
    req.body.branchName
  );

  res.json(result);
};

export const mergeBranch = async (req, res) => {
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
        sha: result?.commit || null,
      },
    });
  }

  res.json(result);
};

export const getPRDiff = async (req, res) => {
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
};

export const getBranches = async (req, res) => {
  const result = await gitService.getBranches(req.params.repoName);
  res.json(result);
};

export const getCommitGraph = async (req, res) => {
  const graph = await gitService.getCommitGraph(req.params.repoName);
  res.json({ graph });
};

export const getFiles = async (req, res) => {
  const result = await gitService.listFiles(
    req.params.repoName,
    req.query.path || ""
  );

  res.json(result);
};

export const saveFileWithCommit = async (req, res) => {
  try {
    const { repoName, path, content, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Commit message is required",
      });
    }

    await gitService.writeFileContent(repoName, path, content || "");

    const result = await gitService.commitFiles(repoName, message, req.user);

    if (req.repo) {
      await logActivity({
        repoId: req.repo._id,
        userId: req.user.id,
        eventType: "commit_pushed",
        message: "File updated and committed",
        metadata: {
          path,
          commit: result?.commit || null,
          sha: result?.commit || null,
        },
      });

      await notifyRepoMembers({
        repo: req.repo,
        excludeUserId: req.user.id,
        type: "commit_pushed",
        message: `New commit in ${req.repo.name}`,
        payload: {
          type: "commit_pushed",
          path,
          sha: result?.commit || null,
        },
        repoId: req.repo._id,
      });
    }

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const saveFile = async (req, res) => {
  const result = await gitService.writeFileContent(
    req.body.repoName,
    req.body.path,
    req.body.content || ""
  );

  res.json(result);
};

export const uploadFiles = async (req, res) => {
  const uploaded = await gitService.uploadFiles(
    req.body.repoName,
    req.files || [],
    req.body.directory || ""
  );

  res.json({ uploaded });
};

export const createFolder = async (req, res) => {
  const result = await gitService.createFolder(req.body.repoName, req.body.path);
  res.json(result);
};

export const deleteFilePath = async (req, res) => {
  const result = await gitService.deletePath(req.body.repoName, req.body.path);
  res.json(result);
};