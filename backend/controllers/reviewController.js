import * as reviewService from "../services/reviewService.js";
import { logActivity, notifyRepoMembers } from "../utils/eventHelpers.js";

export const addReviewComment = async (req, res) => {

  try {

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
    }

    res.status(201).json(created);

  } catch (error) {
    throw error;

  }
};

export const getReviewComments = async (req, res) => {

  try {

    const { prId } = req.params;

    const comments = await reviewService.getComments(prId);

    res.json(comments);

  } catch (error) {
    throw error;

  }
};