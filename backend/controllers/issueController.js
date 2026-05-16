import Issue from "../models/Issue.js";
import Repository from "../models/Repository.js";
import Comment from "../models/Comment.js";
import {
  logActivity,
  notifyRepoMembers,
  createNotification,
  emitUserNotification,
} from "../utils/eventHelpers.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";
import mongoose from "mongoose";
import {
  emitRepoEvent,
} from "../utils/eventHelpers.js";

export const createIssue = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  if (!title || typeof title !== "string") return res.status(400).json({ message: "Title is required" });
  const issueTitle = title.trim();
  if (issueTitle.length < 3) return res.status(400).json({ message: "Issue title must be at least 3 characters long" });
  const repo = req.repo || (await Repository.findById(id));
  if (!repo) return res.status(404).json({ message: "Repository not found" });

  const issue = await Issue.create({ title: issueTitle, description, repoId: id, createdBy: req.user.id });
  await logActivity({ repoId: repo._id, userId: req.user.id, eventType: "issue_created", message: `Issue created: ${issueTitle}`, metadata: { issueId: String(issue._id) } });
  await notifyRepoMembers({
  repo,
  excludeUserId: req.user.id,
  type: "new_issue",
  message: `New issue in ${repo.name}: ${issueTitle}`,
  payload: {
    type: "new_issue",
    issueId: issue._id,
  },
  repoId: repo._id,
  resourceType: "issue",
  resourceId: issue._id,
});
  emitRepoEvent(
  repo._id,
  "repo_event",
  {
    type: "issue_created",
    issueId: issue._id,
    repoId: repo._id,
    title: issue.title,
  }
);
  const hydrated = await Issue.findById(issue._id)
  .populate("createdBy", "_id username email")
  .populate("assignee", "_id username email");
  res.status(201).json(hydrated);
});

export const getIssuesByRepo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const repo = req.repo || (await Repository.findById(id));
  if (!repo) return res.status(404).json({ message: "Repository not found" });

  const { page, limit, skip } = getPagination(req.query);
  const query = { repoId: id };

  const [data, total] = await Promise.all([
    Issue.find(query)
      .populate("createdBy", "_id username email")
      .populate("assignee", "_id username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Issue.countDocuments(query),
  ]);

  res.status(200).json({
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

export const addComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  if (!text || typeof text !== "string") return res.status(400).json({ message: "Comment text is required" });
  const commentText = text.trim();
  if (commentText.length < 1) return res.status(400).json({ message: "Comment cannot be empty" });
  const issue = req.issue || (await Issue.findById(id));
  if (!issue) return res.status(404).json({ message: "Issue not found" });

  const comment = await Comment.create({ issueId: id, userId: req.user.id, text: commentText });
  const repo = req.repo || (await Repository.findById(issue.repoId));
  await logActivity({ repoId: repo._id, userId: req.user.id, eventType: "comment_added", message: `Comment added on issue`, metadata: { issueId: String(comment.issueId) } });
  await notifyRepoMembers({
  repo,
  excludeUserId: req.user.id,
  type: "new_comment",
  message: `New comment in ${repo.name}`,
  payload: {
    type: "new_comment",
    issueId: issue._id,
  },
  repoId: repo._id,
  resourceType: "comment",
  resourceId: comment._id,
});
  const hydrated = await Comment.findById(comment._id).populate("userId", "_id username email");
  res.status(201).json(hydrated);
});

export const getCommentsByIssue = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const issue = req.issue || (await Issue.findById(id));
  if (!issue) return res.status(404).json({ message: "Issue not found" });

  const { page, limit, skip } = getPagination(req.query);
  const query = { issueId: id };

  const [data, total] = await Promise.all([
    Comment.find(query)
      .populate("userId", "_id username email")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit),
    Comment.countDocuments(query),
  ]);

  res.status(200).json({
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

export const closeIssue = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const issue =
    req.issue || (await Issue.findById(id));

  if (!issue) {
    return res.status(404).json({
      message: "Issue not found",
    });
  }

  if (issue.status === "closed") {
    return res.status(400).json({
      message: "Issue is already closed",
    });
  }

  const repo =
    req.repo || (await Repository.findById(issue.repoId));

  if (!repo) {
    return res.status(404).json({
      message: "Repository not found",
    });
  }

  const isCreator =
    String(issue.createdBy) === String(req.user.id);

  const isRepoMember = repo.collaborators.some(
  (c) =>
    String(c.userId) === String(req.user.id) &&
    c.role !== "viewer"
);

  const isOwner =
    String(repo.owner) === String(req.user.id);

  if (!isCreator && !isRepoMember && !isOwner) {
    return res.status(403).json({
      message: "Not authorized",
    });
  }

  issue.status = "closed";

  await issue.save();

  await logActivity({
    repoId: repo._id,
    userId: req.user.id,
    eventType: "issue_closed",
    message: `Issue closed`,
    metadata: { issueId: String(issue._id) },
  });

  const hydrated = await Issue.findById(issue._id)
    .populate("createdBy", "_id username email");

  emitRepoEvent(
  repo._id,
  "repo_event",
  {
    type: "issue_closed",
    issueId: issue._id,
    repoId: repo._id,
  }
);

  res.status(200).json({
    message: "Issue closed successfully",
    issue: hydrated,
  });
});

export const assignIssue = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { assigneeId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(assigneeId)) {
    return res.status(400).json({
      message: "Invalid assigneeId",
    });
  }

  const issue =
    req.issue || (await Issue.findById(id));

  if (!issue) {
    return res.status(404).json({
      message: "Issue not found",
    });
  }

  const repo =
    req.repo ||
    (await Repository.findById(issue.repoId));

  if (!repo) {
    return res.status(404).json({
      message: "Repository not found",
    });
  }

  const isOwner =
    String(repo.owner) === String(req.user.id);

  const isCollaborator =
    repo.collaborators.some(
      (c) =>
        String(c.userId) ===
          String(req.user.id) &&
        c.role !== "viewer"
    );

  if (!isOwner && !isCollaborator) {
    return res.status(403).json({
      message: "Not authorized",
    });
  }

  issue.assignee = assigneeId;

  await issue.save();

  await logActivity({
    repoId: repo._id,
    userId: req.user.id,
    eventType: "issue_assigned",
    message: "Issue assigned",
    metadata: {
      issueId: String(issue._id),
      assigneeId: String(assigneeId),
    },
  });

  await createNotification({
    userId: assigneeId,

    repoId: repo._id,

    type: "issue_assigned",

    message: `You were assigned an issue in ${repo.name}`,

    resourceType: "issue",

    resourceId: issue._id,
  });

  emitUserNotification(assigneeId, {
    type: "issue_assigned",

    message: `You were assigned an issue in ${repo.name}`,

    issueId: issue._id,
  });

  const hydrated = await Issue.findById(issue._id)
    .populate(
      "createdBy",
      "_id username email"
    )
    .populate(
      "assignee",
      "_id username email"
    );

  res.status(200).json(hydrated);
});
