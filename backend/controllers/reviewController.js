import * as reviewService from "../services/reviewService.js";
import { logActivity, notifyRepoMembers } from "../utils/eventHelpers.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";
import {
  emitRepoEvent,
} from "../utils/eventHelpers.js";

export const addReviewComment = asyncHandler(async (req, res) => {

    const { prId, filePath, lineNumber, comment } = req.body;

    if (!prId) {
      return res.status(400).json({ error: "prId is required" });
    }

    if (typeof comment !== "string" || comment.trim().length === 0) {
      return res.status(400).json({ error: "comment cannot be empty" });
    }

    if (lineNumber !== undefined && lineNumber !== null) {
      const ln = Number(lineNumber);
      if (!Number.isFinite(ln) || ln < 1) {
        return res.status(400).json({ error: "lineNumber must be >= 1" });
      }
    }

    const created = await reviewService.addComment(
      { prId, filePath, lineNumber, comment },
      req.user.id
    );

    const repo = req.repo;
    if (repo) {
      await logActivity({
        repoId: repo._id,
        userId: req.user.id,
        eventType: "comment_added",
        message: "Review comment added",
        metadata: { prId: String(prId), commentId: String(created._id) },
      });

      await notifyRepoMembers({
        repo,
        excludeUserId: req.user.id,
        type: "new_comment",
        message: `New review comment in ${repo.name}`,
        payload: { type: "new_comment", prId: prId, commentId: created._id },
        repoId: repo._id,
      });
      emitRepoEvent(
  repo._id,
  "repo_event",
  {
    type: "review_comment_added",
    prId,
    repoId: repo._id,
    commentId: created._id,
  }
);
    }

    res.status(201).json(created);
});

export const getReviewComments = asyncHandler(async (req, res) => {
    const { prId } = req.params;
    const { page, limit, skip } = getPagination(req.query);

    const { data, total } = await reviewService.getComments(prId, skip, limit);

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
});