import Issue from "../models/Issue.js";
import Repository from "../models/Repository.js";
import Comment from "../models/Comment.js";
import { logActivity, notifyRepoMembers } from "../utils/eventHelpers.js";

const issuePopulate = [
  { path: "createdBy", select: "_id username email" },
  { path: "assignees", select: "_id username email" },
  { path: "labels" }
];

export const createIssue = async (req, res) => {
  const { id } = req.params;
  const { title, description, labels, assignees } = req.body;
  if (!title || typeof title !== "string") return res.status(400).json({ message: "Title is required" });
  const issueTitle = title.trim();
  if (issueTitle.length < 3) return res.status(400).json({ message: "Issue title must be at least 3 characters long" });
  
  const repo = await Repository.findByIdAndUpdate(
    id,
    { $inc: { issueCount: 1 } },
    { new: true }
  );

  if (!repo) return res.status(404).json({ message: "Repository not found" });

  const newIssueData = {
    title: issueTitle,
    description,
    repoId: id,
    createdBy: req.user.id,
    issueNumber: repo.issueCount,
  };

  const isOwner = String(repo.owner) === String(req.user.id);
  const isCollab = repo.collaborators.some((c) => String(c.userId) === String(req.user.id));
  const hasCollaboratorAccess = isOwner || isCollab;

  if (labels && Array.isArray(labels) && hasCollaboratorAccess) {
    newIssueData.labels = labels;
  }

  if (assignees && Array.isArray(assignees) && hasCollaboratorAccess) {
    const validAssignees = [];
    for (const userId of assignees) {
      const isO = String(repo.owner) === String(userId);
      const isC = repo.collaborators.some((c) => String(c.userId) === String(userId));
      if (isO || isC) validAssignees.push(userId);
    }
    newIssueData.assignees = validAssignees;
  }

  const issue = await Issue.create(newIssueData);

  await logActivity({ repoId: repo._id, userId: req.user.id, eventType: "issue_created", message: `Issue created: ${issueTitle}`, metadata: { issueId: String(issue._id) } });
  await notifyRepoMembers({ repo, excludeUserId: req.user.id, type: "new_issue", message: `New issue in ${repo.name}: ${issueTitle}`, payload: { type: "new_issue", message: `New issue: ${issueTitle}` }, repoId: repo._id });
  
  const hydrated = await Issue.findById(issue._id).populate(issuePopulate);
  res.status(201).json(hydrated);
};

export const getIssuesByRepo = async (req, res) => {
  const { id } = req.params;
  const repo = req.repo || (await Repository.findById(id));
  if (!repo) return res.status(404).json({ message: "Repository not found" });

  const { status, assignee, label, page = 1, limit = 20, sort = "created" } = req.query;

  let query = { repoId: id };

  if (status === "open" || status === "closed") {
    query.status = status;
  }
  if (assignee) {
    query.assignees = assignee;
  }
  if (label) {
    query.labels = label;
  }

  let sortQuery = { createdAt: -1 };
  if (sort === "updated") {
    sortQuery = { updatedAt: -1 };
  } else if (sort === "created") {
    sortQuery = { createdAt: -1 };
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const issues = await Issue.find(query)
    .populate(issuePopulate)
    .sort(sortQuery)
    .skip(skip)
    .limit(limitNum);

  res.status(200).json(issues);
};

export const getIssueById = async (req, res) => {
  const { id } = req.params;
  const issue = await Issue.findById(id).populate(issuePopulate);
  if (!issue) return res.status(404).json({ message: "Issue not found" });
  res.status(200).json(issue);
};

export const updateIssue = async (req, res) => {
  const { id } = req.params;
  const { title, description, assignees, labels } = req.body;
  
  const issue = req.issue || (await Issue.findById(id));
  if (!issue) return res.status(404).json({ message: "Issue not found" });
  
  const repo = req.repo || (await Repository.findById(issue.repoId));

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim().length < 3) {
      return res.status(400).json({ message: "Title must be at least 3 characters long" });
    }
    issue.title = title.trim();
  }

  if (description !== undefined) {
    issue.description = description;
  }

  if (assignees !== undefined && Array.isArray(assignees)) {
    // Validate assignees are repo members
    const validAssignees = [];
    for (const userId of assignees) {
      const isOwner = String(repo.owner) === String(userId);
      const isCollab = repo.collaborators.some((c) => String(c.userId) === String(userId));
      if (isOwner || isCollab) {
        validAssignees.push(userId);
      } else {
        return res.status(400).json({ message: `User ${userId} is not a member of the repository` });
      }
    }
    issue.assignees = validAssignees;
  }

  if (labels !== undefined && Array.isArray(labels)) {
    issue.labels = labels;
  }

  await issue.save();
  const hydrated = await Issue.findById(issue._id).populate(issuePopulate);
  res.status(200).json(hydrated);
};

export const addComment = async (req, res) => {
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
  await notifyRepoMembers({ repo, excludeUserId: req.user.id, type: "new_comment", message: `New comment in ${repo.name}`, payload: { type: "new_comment", message: `New comment` }, repoId: repo._id });
  const hydrated = await Comment.findById(comment._id).populate("userId", "_id username email");
  res.status(201).json(hydrated);
};

export const getCommentsByIssue = async (req, res) => {
  const { id } = req.params;
  const issue = req.issue || (await Issue.findById(id));
  if (!issue) return res.status(404).json({ message: "Issue not found" });
  const comments = await Comment.find({ issueId: id }).populate("userId", "_id username email").sort({ createdAt: 1 });
  res.status(200).json(comments);
};

export const deleteComment = async (req, res) => {
  const { issueId, commentId } = req.params;
  const comment = await Comment.findOne({ _id: commentId, issueId: issueId });
  if (!comment) return res.status(404).json({ message: "Comment not found" });

  if (String(comment.userId) !== String(req.user.id)) {
    // Check if repo owner or collaborator
    const issue = req.issue || (await Issue.findById(issueId));
    const repo = req.repo || (await Repository.findById(issue.repoId));
    const isOwner = String(repo.owner) === String(req.user.id);
    const isCollab = repo.collaborators.some((c) => String(c.userId) === String(req.user.id));
    if (!isOwner && !isCollab) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }
  }

  await Comment.findByIdAndDelete(commentId);
  res.status(200).json({ message: "Comment deleted" });
};

export const closeIssue = async (req, res) => {
  const { id } = req.params;
  const issue = req.issue || (await Issue.findById(id));
  if (!issue) return res.status(404).json({ message: "Issue not found" });
  if (issue.status === "closed") return res.status(400).json({ message: "Issue is already closed" });
  const repo = req.repo || (await Repository.findById(issue.repoId));
  issue.status = "closed";
  await issue.save();
  await logActivity({ repoId: repo._id, userId: req.user.id, eventType: "issue_closed", message: `Issue closed`, metadata: { issueId: String(issue._id) } });
  const hydrated = await Issue.findById(issue._id).populate(issuePopulate);
  res.status(200).json({ message: "Issue closed successfully", issue: hydrated });
};

export const reopenIssue = async (req, res) => {
  const { id } = req.params;
  const issue = req.issue || (await Issue.findById(id));
  if (!issue) return res.status(404).json({ message: "Issue not found" });
  if (issue.status === "open") return res.status(400).json({ message: "Issue is already open" });
  const repo = req.repo || (await Repository.findById(issue.repoId));
  issue.status = "open";
  await issue.save();
  await logActivity({ repoId: repo._id, userId: req.user.id, eventType: "issue_reopened", message: `Issue reopened`, metadata: { issueId: String(issue._id) } });
  const hydrated = await Issue.findById(issue._id).populate(issuePopulate);
  res.status(200).json({ message: "Issue reopened successfully", issue: hydrated });
};
