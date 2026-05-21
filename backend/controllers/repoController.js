import Repository from "../models/Repository.js";
import { logActivity } from "../utils/eventHelpers.js";
import Issue from "../models/Issue.js";
import Comment from "../models/Comment.js";
import PullRequest from "../models/PullRequest.js";
import ReviewComment from "../models/ReviewComment.js";
import Notification from "../models/NotificationModel.js";
import Activity from "../models/ActivityModel.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import { initRepository } from "../services/gitService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";
import {
  createNotification,
  emitUserNotification,
} from "../utils/eventHelpers.js";

const repoPopulate = [
  { path: "owner", select: "_id username email" },
  { path: "collaborators.userId", select: "_id username email" },
];

const validateRepoName = (name) => {
  const repoName = String(name || "").trim();

  if (!repoName) {
    return "Repository name is required";
  }

  if (repoName.length < 3) {
    return "Repository name must be at least 3 characters long";
  }

  if (repoName.length > 60) {
    return "Repository name must be at most 60 characters long";
  }

  if (!/^[a-zA-Z]/.test(repoName)) {
    return "Repository name must start with a letter";
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(repoName)) {
    return "Repository name can only contain letters, numbers, hyphens and underscores";
  }

  if (/^\d+$/.test(repoName)) {
    return "Repository name cannot contain only numbers";
  }

  if (/^[_-]+$/.test(repoName)) {
    return "Repository name cannot contain only symbols";
  }

  if (!/[a-zA-Z]{3,}/.test(repoName.replace(/[_-]/g, ""))) {
    return "Repository name must contain a meaningful word with at least 3 letters";
  }

  return null;
};

const sanitizeRepoForViewer = (repo, currentUserId) => {
  if (!repo) return repo;

  const repoObj = typeof repo.toObject === "function" ? repo.toObject() : repo;

  const isOwner =
    String(repoObj.owner?._id || repoObj.owner) === String(currentUserId);

  if (isOwner) {
    return repoObj;
  }

  if (Array.isArray(repoObj.collaborators)) {
    repoObj.collaborators = repoObj.collaborators.map((c) => ({
      role: c.role,
      userId: c.userId
        ? {
            _id: c.userId._id,
            username: c.userId.username,
          }
        : null,
    }));
  }

  return repoObj;
};

export const createRepo = asyncHandler(async (req, res) => {
  const {
    name,
    description = "",
    visibility = "private",
    defaultBranch = "main",
  } = req.body || {};

  const validationError = validateRepoName(name);

  if (validationError) {
    return res.status(400).json({
      message: validationError,
    });
  }

  const repoName = String(name).trim();

  const exists = await Repository.findOne({
    owner: req.user.id,
    name: repoName,
  });

  if (exists) {
    return res.status(409).json({
      message: "Repository name already exists",
    });
  }

  const repo = await Repository.create({
    name: repoName,
    description: String(description || "").trim(),
    visibility,
    defaultBranch,
    owner: req.user.id,
    collaborators: [{ userId: req.user.id, role: "owner" }],
  });

  await initRepository(repoName, defaultBranch);

  await logActivity({
    repoId: repo._id,
    userId: req.user.id,
    eventType: "repo_created",
    message: `Repository created: ${repo.name}`,
    metadata: {},
  });

  const hydrated = await Repository.findById(repo._id).populate(repoPopulate);

  res.status(201).json(hydrated);
});

export const getAllRepos = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page, limit, skip } = getPagination(req.query);

  const query = {
    $or: [{ owner: userId }, { "collaborators.userId": userId }],
  };

  const [repos, total] = await Promise.all([
    Repository.find(query)
      .populate(repoPopulate)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    Repository.countDocuments(query),
  ]);

  const data = repos.map((repo) => sanitizeRepoForViewer(repo, req.user.id));

  res.status(200).json({
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  });
});

export const getPublicRepos = asyncHandler(async (req, res) => {
  const repos = await Repository.find({ visibility: "public" })
    .populate(repoPopulate)
    .sort({ updatedAt: -1 });

  res.status(200).json(repos);
});

export const getRepoById = asyncHandler(async (req, res) => {
  const repo = req.repo || (await Repository.findById(req.params.id));

  if (!repo) {
    return res.status(404).json({
      message: "Repository not found",
    });
  }

  const hydrated = await Repository.findById(repo._id).populate(repoPopulate);
  const sanitized = sanitizeRepoForViewer(hydrated, req.user.id);

  res.status(200).json(sanitized);
});

export const getRepoByAlias = asyncHandler(async (req, res) => {
  const { username, repoName } = req.params;

  const user = await User.findOne({
    username: {
      $regex: new RegExp(`^${username.trim()}$`, "i"),
    },
  });

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  const repo = await Repository.findOne({
    owner: user._id,
    name: repoName.trim(),
  }).populate(repoPopulate);

  if (!repo) {
    return res.status(404).json({
      message: "Repository not found",
    });
  }

  const isOwner = String(repo.owner._id) === String(req.user.id);

  const collaborator = repo.collaborators.find(
    (c) => String(c.userId._id) === String(req.user.id)
  );

  const hasAccess = repo.visibility === "public" || isOwner || collaborator;

  if (!hasAccess) {
    return res.status(403).json({
      message: "Access denied",
    });
  }

  res.status(200).json(repo);
});

export const deleteRepo = asyncHandler(async (req, res) => {
  const repo = await Repository.findById(req.params.id);

  if (!repo) {
    return res.status(404).json({
      message: "Repository not found",
    });
  }

  if (String(repo.owner) !== String(req.user.id)) {
    return res.status(403).json({
      message: "Not authorized",
    });
  }

  const issueDocs = await Issue.find({ repoId: repo._id }).select("_id");
  const issueIds = issueDocs.map((d) => d._id);

  if (issueIds.length > 0) {
    await Comment.deleteMany({ issueId: { $in: issueIds } });
    await Issue.deleteMany({ repoId: repo._id });
  }

  const prDocs = await PullRequest.find({ repoId: repo._id }).select("_id");
  const prIds = prDocs.map((d) => d._id);

  if (prIds.length > 0) {
    await ReviewComment.deleteMany({ prId: { $in: prIds } });
  }

  await PullRequest.deleteMany({ repoId: repo._id });
  await Notification.deleteMany({ repoId: repo._id });
  await Activity.deleteMany({ repoId: repo._id });
  await repo.deleteOne();

  res.status(200).json({
    message: "Repository deleted successfully",
  });
});

export const addCollaborator = asyncHandler(async (req, res) => {
  const { userId, role } = req.body || {};

  if (!userId) {
    return res.status(400).json({
      message: "userId is required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      message: "Invalid userId",
    });
  }

  const repo = req.repo;

  if (!repo) {
    return res.status(404).json({
      message: "Repository not found",
    });
  }

  const requestedRole = role || "collaborator";

  if (!["owner", "collaborator", "viewer"].includes(requestedRole)) {
    return res.status(400).json({
      message: "Invalid role",
    });
  }

  if (requestedRole === "owner") {
    return res.status(400).json({
      message: "Use ownership transfer to set owner",
    });
  }

  if (String(repo.owner) === String(userId)) {
    return res.status(400).json({
      message: "User is already the owner",
    });
  }

  const existing = repo.collaborators.find(
    (c) => String(c.userId) === String(userId)
  );

  if (existing) {
    existing.role = requestedRole;
  } else {
    repo.collaborators.push({
      userId,
      role: requestedRole,
    });
  }

  await repo.save();

  await logActivity({
    repoId: repo._id,
    userId: req.user.id,
    eventType: "collaborator_added",
    message: "Collaborator added/updated",
    metadata: {
      targetUserId: String(userId),
      role: requestedRole,
      repoId: String(repo._id),
    },
  });

  await createNotification({
    userId,
    repoId: repo._id,
    type: "collaborator_added",
    message: `You were added to ${repo.name} as ${requestedRole}`,
    resourceType: "repository",
    resourceId: repo._id,
  });

  emitUserNotification(userId, {
    type: "collaborator_added",
    message: `You were added to ${repo.name}`,
    repoId: repo._id,
  });

  const hydrated = await Repository.findById(repo._id).populate(repoPopulate);

  res.status(200).json(hydrated);
});

export const removeCollaborator = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const repo = req.repo;

  if (!repo) {
    return res.status(404).json({
      message: "Repository not found",
    });
  }

  if (String(repo.owner) === String(userId)) {
    return res.status(400).json({
      message: "Repository owner cannot be removed",
    });
  }

  const existing = repo.collaborators.find(
    (c) => String(c.userId) === String(userId)
  );

  if (!existing) {
    return res.status(404).json({
      message: "Collaborator not found",
    });
  }

  repo.collaborators = repo.collaborators.filter(
    (c) => String(c.userId) !== String(userId)
  );

  await repo.save();

  await logActivity({
    repoId: repo._id,
    userId: req.user.id,
    eventType: "collaborator_removed",
    message: "Collaborator removed",
    metadata: {
      targetUserId: String(userId),
      repoId: String(repo._id),
    },
  });

  const hydrated = await Repository.findById(repo._id).populate(repoPopulate);

  res.status(200).json(hydrated);
});

export const updateCollaboratorRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body || {};
  const repo = req.repo;

  if (!repo) {
    return res.status(404).json({
      message: "Repository not found",
    });
  }

  if (!role) {
    return res.status(400).json({
      message: "role is required",
    });
  }

  if (!["collaborator", "viewer"].includes(role)) {
    return res.status(400).json({
      message: "Invalid role",
    });
  }

  if (String(repo.owner) === String(userId)) {
    return res.status(400).json({
      message: "Repository owner role cannot be modified",
    });
  }

  const collaborator = repo.collaborators.find(
    (c) => String(c.userId) === String(userId)
  );

  if (!collaborator) {
    return res.status(404).json({
      message: "Collaborator not found",
    });
  }

  collaborator.role = role;

  await repo.save();

  await logActivity({
    repoId: repo._id,
    userId: req.user.id,
    eventType: "collaborator_role_updated",
    message: "Collaborator role updated",
    metadata: {
      targetUserId: String(userId),
      role,
      repoId: String(repo._id),
    },
  });

  const hydrated = await Repository.findById(repo._id).populate(repoPopulate);

  res.status(200).json(hydrated);
});

export const toggleArchiveRepo = asyncHandler(async (req, res) => {
  const repo = req.repo;

  if (!repo) {
    return res.status(404).json({
      message: "Repository not found",
    });
  }

  repo.isArchived = !repo.isArchived;

  await repo.save();

  await logActivity({
    repoId: repo._id,
    userId: req.user.id,
    eventType: repo.isArchived ? "repo_archived" : "repo_unarchived",
    message: repo.isArchived
      ? `Repository archived: ${repo.name}`
      : `Repository unarchived: ${repo.name}`,
    metadata: {
      repoId: String(repo._id),
      archived: repo.isArchived,
    },
  });

  const hydrated = await Repository.findById(repo._id).populate(repoPopulate);

  res.status(200).json({
    message: repo.isArchived
      ? "Repository archived successfully"
      : "Repository unarchived successfully",
    repository: hydrated,
  });
});