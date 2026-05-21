import * as prService from "../services/prService.js";
import PullRequest from "../models/PullRequest.js";
import * as gitService from "../services/gitService.js";
import { logActivity, notifyRepoMembers, emitRepoEvent } from "../utils/eventHelpers.js";
import Repository from "../models/Repository.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const hydratePR = (id) =>
  PullRequest.findById(id)
    .populate("createdBy", "_id username email")
    .populate("reviewDecisions.userId", "_id username email")
    .populate("comments.userId", "_id username email")
    .populate("inlineComments.userId", "_id username email");

export const createPullRequest = asyncHandler(async (req, res) => {
  const repo = req.repo;
  const activeRepoName = repo ? repo.name : req.body.repoName;
  const { title, sourceBranch, targetBranch } = req.body || {};

  if (!activeRepoName || typeof activeRepoName !== "string") {
    return res.status(400).json({ message: "repoName or repoId is required" });
  }

  if (!title || typeof title !== "string") {
    return res.status(400).json({ message: "title is required" });
  }

  if (!sourceBranch || typeof sourceBranch !== "string") {
    return res.status(400).json({ message: "sourceBranch is required" });
  }

  if (!targetBranch || typeof targetBranch !== "string") {
    return res.status(400).json({ message: "targetBranch is required" });
  }

  const pr = await prService.createPR({
    ...req.body,
    repoName: activeRepoName,
    repoId: repo ? repo._id : undefined,
    createdBy: req.user.id
  });

  if (repo) {
    await logActivity({
      repoId: repo._id,
      userId: req.user.id,
      eventType: "pull_request_opened",
      message: `PR opened: ${pr.title}`,
      metadata: { prId: String(pr._id) }
    });

    await notifyRepoMembers({
      repo,
      excludeUserId: req.user.id,
      type: "new_pr",
      message: `New pull request in ${repo.name}: ${pr.title}`,
      payload: {
        type: "new_pr",
        message: `PR: ${pr.title}`,
        prId: pr._id
      },
      repoId: repo._id,
      resourceType: "pr",
      resourceId: pr._id,
    });

    emitRepoEvent(repo._id, "repo_event", {
      type: "pull_request_opened",
      prId: pr._id,
      repoId: repo._id,
      title: pr.title,
    });
  }

  res.json(await hydratePR(pr._id));
});

export const getPullRequests = asyncHandler(async (req, res) => {
  const prs = await prService.getPRs(req.repo._id);
  res.json(prs);
});

export const getPullRequestById = asyncHandler(async (req, res) => {
  const pr = await hydratePR(req.params.prId);

  if (!pr) {
    return res.status(404).json({ message: "Pull Request not found" });
  }

  res.json(pr);
});

export const mergePullRequest = asyncHandler(async (req, res) => {
  const { prId } = req.params;

  const pr = await PullRequest.findById(prId).populate("reviewDecisions.userId", "_id username email");

  if (!pr) {
    return res.status(404).json({ error: "Pull Request not found", message: "Pull Request not found" });
  }

  if (pr.status === "merged") {
    return res.status(400).json({ error: "PR already merged", message: "PR already merged" });
  }

  if (pr.status === "closed") {
    return res.status(400).json({ error: "Closed PR cannot be merged", message: "Closed PR cannot be merged" });
  }

  const approvals = pr.reviewDecisions.filter((review) => review.decision === "approved");
  const changeRequests = pr.reviewDecisions.filter((review) => review.decision === "changes_requested");

  if (changeRequests.length > 0) {
    return res.status(400).json({ error: "PR has requested changes", message: "PR has requested changes" });
  }

  if (approvals.length === 0) {
    return res.status(400).json({ error: "PR requires at least one approval", message: "PR requires at least one approval" });
  }

  try {
    await gitService.mergeBranch(pr.repoName, pr.sourceBranch, pr.targetBranch);
  } catch (error) {
    const isConflict = error.message && (
      error.message.includes("CONFLICTS") ||
      error.message.includes("conflict") ||
      error.message.includes("needs merge")
    );

    if (isConflict) {
      pr.hasConflicts = true;
      await pr.save();
      return res.status(400).json({
        error: "Merge conflict detected",
        message: "This branch has merge conflicts that must be resolved before merging."
      });
    }

    throw error;
  }

  pr.status = "merged";
  pr.mergedAt = new Date();
  await pr.save();

  const repo = req.repo;

  if (repo) {
    await logActivity({
      repoId: repo._id,
      userId: req.user.id,
      eventType: "pull_request_merged",
      message: `PR merged: ${pr.title}`,
      metadata: { prId: String(pr._id) }
    });

    await notifyRepoMembers({
      repo,
      excludeUserId: req.user.id,
      type: "pr_merged",
      message: `Pull request merged in ${repo.name}: ${pr.title}`,
      payload: {
        type: "pr_merged",
        message: `PR merged: ${pr.title}`,
        prId: pr._id
      },
      repoId: repo._id,
      resourceType: "pr",
      resourceId: pr._id,
    });

    emitRepoEvent(repo._id, "repo_event", {
      type: "pull_request_merged",
      prId: pr._id,
      repoId: repo._id,
      title: pr.title,
    });
  }

  res.json({ message: "Pull Request merged successfully" });
});

export const closePullRequest = asyncHandler(async (req, res) => {
  const { prId } = req.params;

  const pr = await PullRequest.findById(prId);

  if (!pr) {
    return res.status(404).json({ error: "Pull Request not found" });
  }

  if (pr.status === "merged") {
    return res.status(400).json({ error: "Merged PR cannot be closed" });
  }

  if (pr.status === "closed") {
    return res.status(400).json({ error: "PR already closed" });
  }

  pr.status = "closed";
  pr.closedAt = new Date();

  await pr.save();

  const repo = req.repo;

  if (repo) {
    await logActivity({
      repoId: repo._id,
      userId: req.user.id,
      eventType: "pull_request_closed",
      message: `PR closed: ${pr.title}`,
      metadata: { prId: String(pr._id) }
    });

    await notifyRepoMembers({
      repo,
      excludeUserId: req.user.id,
      type: "pr_closed",
      message: `Pull request closed in ${repo.name}: ${pr.title}`,
      payload: {
        type: "pr_closed",
        message: `PR closed: ${pr.title}`,
        prId: pr._id
      },
      repoId: repo._id
    });
  }

  res.json({ message: "Pull Request closed successfully" });
});

export const reopenPullRequest = asyncHandler(async (req, res) => {
  const { prId } = req.params;

  const pr = await PullRequest.findById(prId);

  if (!pr) {
    return res.status(404).json({ error: "Pull Request not found" });
  }

  if (pr.status === "merged") {
    return res.status(400).json({ error: "Merged PR cannot be reopened" });
  }

  if (pr.status !== "closed") {
    return res.status(400).json({ error: "Only closed PR can be reopened" });
  }

  pr.status = "open";
  pr.closedAt = null;

  await pr.save();

  const repo = req.repo;
  if (repo) {
    await logActivity({
      repoId: repo._id,
      userId: req.user.id,
      eventType: "pull_request_reopened",
      message: `PR reopened: ${pr.title}`,
      metadata: { prId: String(pr._id) }
    });

    await notifyRepoMembers({
      repo,
      excludeUserId: req.user.id,
      type: "pr_reopened",
      message: `PR reopened in ${repo.name}: ${pr.title}`,
      payload: {
        type: "pr_reopened",
        prId: String(pr._id),
        title: pr.title
      },
      repoId: repo._id
    });

    emitRepoEvent(repo._id, "pr_reopened", {
      prId: pr._id,
      status: pr.status
    });
  }

  res.json({ message: "Pull Request reopened successfully" });
});

export const submitReviewDecision = asyncHandler(async (req, res) => {
  const { prId } = req.params;
  const { decision, body } = req.body;
  const allowed = ["approved", "changes_requested", "commented"];

  if (!allowed.includes(decision)) {
    return res.status(400).json({ error: "Invalid review decision" });
  }

  const pr = await PullRequest.findById(prId);

  if (!pr) {
    return res.status(404).json({ error: "Pull Request not found" });
  }

  if (pr.status === "merged") {
    return res.status(400).json({ error: "Merged PR cannot be reviewed" });
  }

  pr.reviewDecisions.push({
    userId: req.user.id,
    decision,
    body: body || "",
    decidedAt: new Date()
  });

  await pr.save();

  res.json({ message: "Review submitted successfully" });
});

export const getReviewDecisions = asyncHandler(async (req, res) => {
  const { prId } = req.params;
  const pr = await PullRequest.findById(prId).populate("reviewDecisions.userId", "_id username email");

  if (!pr) {
    return res.status(404).json({ error: "Pull Request not found" });
  }

  res.json(pr.reviewDecisions);
});

export const addPRComment = asyncHandler(async (req, res) => {
  const { prId } = req.params;
  const { body } = req.body;

  if (!body || !body.trim()) {
    return res.status(400).json({ error: "Comment body is required" });
  }

  const pr = await PullRequest.findById(prId);

  if (!pr) {
    return res.status(404).json({ error: "Pull Request not found" });
  }

  pr.comments.push({
    userId: req.user.id,
    body,
    createdAt: new Date()
  });

  await pr.save();

  res.json({ message: "Comment added successfully" });
});

export const getPRComments = asyncHandler(async (req, res) => {
  const { prId } = req.params;
  const pr = await PullRequest.findById(prId).populate("comments.userId", "_id username email");

  if (!pr) {
    return res.status(404).json({ error: "Pull Request not found" });
  }

  res.json(pr.comments);
});

export const deletePRComment = asyncHandler(async (req, res) => {
  const { prId, commentId } = req.params;

  const pr = await PullRequest.findById(prId);

  if (!pr) {
    return res.status(404).json({ error: "Pull Request not found" });
  }

  const comment = pr.comments.id(commentId);

  if (!comment) {
    return res.status(404).json({ error: "Comment not found" });
  }

  if (comment.userId.toString() !== req.user.id) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  comment.deleteOne();
  await pr.save();

  res.json({ message: "Comment deleted successfully" });
});

export const addInlineComment = asyncHandler(async (req, res) => {
  const { prId } = req.params;
  const { filePath, lineNumber, body } = req.body;

  if (!filePath || !body) {
    return res.status(400).json({ error: "filePath and body required" });
  }

  if (!lineNumber || lineNumber < 1) {
    return res.status(400).json({ error: "Valid lineNumber required" });
  }

  const pr = await PullRequest.findById(prId);

  if (!pr) {
    return res.status(404).json({ error: "Pull Request not found" });
  }

  pr.inlineComments.push({
    userId: req.user.id,
    filePath,
    lineNumber,
    body,
    createdAt: new Date()
  });

  await pr.save();

  res.json({ message: "Inline comment added" });
});

export const getInlineComments = asyncHandler(async (req, res) => {
  const { prId } = req.params;
  const pr = await PullRequest.findById(prId).populate("inlineComments.userId", "_id username email");

  if (!pr) {
    return res.status(404).json({ error: "Pull Request not found" });
  }

  res.json(pr.inlineComments);
});

export const deleteInlineComment = asyncHandler(async (req, res) => {
  const { prId, commentId } = req.params;
  const pr = await PullRequest.findById(prId);

  if (!pr) {
    return res.status(404).json({ error: "Pull Request not found" });
  }

  const comment = pr.inlineComments.id(commentId);

  if (!comment) {
    return res.status(404).json({ error: "Inline comment not found" });
  }

  if (comment.userId.toString() !== req.user.id) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  comment.deleteOne();
  await pr.save();

  res.json({ message: "Inline comment deleted" });
});
