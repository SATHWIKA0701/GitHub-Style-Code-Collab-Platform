import express from "express";
import * as prController from "../controllers/prController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import permissionMiddleware from "../middleware/permissionMiddleware.js";
import Repository from "../models/Repository.js";
import PullRequest from "../models/PullRequest.js";
import archiveMiddleware from "../middleware/archiveMiddleware.js";

const router = express.Router();

const loadRepoFromBody = async (
  req,
  res,
  next
) => {
  try {

    const { repoName } = req.body;

    if (!repoName) {
      return res.status(400).json({
        message: "repoName is required"
      });
    }

    const repo =
      await Repository.findOne({
        name: repoName
      });

    if (!repo) {
      return res.status(404).json({
        message: "Repository not found"
      });
    }

    req.repo = repo;

    next();

  } catch (error) {

    next(error);

  }
};

const loadRepoFromPrId = async (
  req,
  res,
  next
) => {
  try {

    const { prId } = req.params;

    const pr =
      await PullRequest.findById(prId);

    if (!pr) {
      return res.status(404).json({
        message: "Pull Request not found"
      });
    }

    const repo =
      await Repository.findOne({
        name: pr.repoName
      });

    if (!repo) {
      return res.status(404).json({
        message:
          "Repository not found for this PR"
      });
    }

    req.repo = repo;

    next();

  } catch (error) {

    next(error);

  }
};

const loadRepoFromRepoNameParam =
  async (req, res, next) => {

    try {
      const { repoName } = req.params;

      if (!repoName) {
        return res.status(400).json({
          message: "repoName is required"
        });
      }

      const repo =
        await Repository.findOne({
          name: repoName
        });

      if (!repo) {
        return res.status(404).json({
          message: "Repository not found"
        });
      }

      req.repo = repo;

      next();

    } catch (error) {

      next(error);

    }
  };

// create PR
router.post(
  "/",
  authMiddleware,
  loadRepoFromBody,
  permissionMiddleware("collaborator"),
  archiveMiddleware,
  prController.createPullRequest
);

// get all PRs
router.get(
  "/repo/:repoName",
  authMiddleware,
  loadRepoFromRepoNameParam,
  permissionMiddleware("viewer"),
  prController.getPullRequests
);

// get single PR
router.get(
  "/item/:prId",
  authMiddleware,
  loadRepoFromPrId,
  permissionMiddleware("viewer"),
  prController.getPullRequestById
);

// merge PR
router.put(
  "/:prId/merge",
  authMiddleware,
  loadRepoFromPrId,
  permissionMiddleware("owner"),
  archiveMiddleware,
  prController.mergePullRequest
);

// close PR
router.put(
  "/:prId/close",
  authMiddleware,
  loadRepoFromPrId,
  permissionMiddleware("collaborator"),
  prController.closePullRequest
);

// reopen PR
router.put(
  "/:prId/reopen",
  authMiddleware,
  loadRepoFromPrId,
  permissionMiddleware("collaborator"),
  prController.reopenPullRequest
);

// submit review
router.post(
  "/:prId/review",
  authMiddleware,
  loadRepoFromPrId,
  permissionMiddleware("collaborator"),
  prController.submitReviewDecision
);

// get reviews
router.get(
  "/:prId/reviews",
  authMiddleware,
  loadRepoFromPrId,
  permissionMiddleware("viewer"),
  prController.getReviewDecisions
);

// add comment
router.post(
  "/:prId/comments",
  authMiddleware,
  loadRepoFromPrId,
  permissionMiddleware("collaborator"),
  prController.addPRComment
);

// get comments
router.get(
  "/:prId/comments",
  authMiddleware,
  loadRepoFromPrId,
  permissionMiddleware("viewer"),
  prController.getPRComments
);

// delete comment
router.delete(
  "/:prId/comments/:commentId",
  authMiddleware,
  loadRepoFromPrId,
  permissionMiddleware("collaborator"),
  prController.deletePRComment
);
router.post(
  "/:prId/inline-comments",
  authMiddleware,
  loadRepoFromPrId,
  permissionMiddleware("collaborator"),
  prController.addInlineComment
);

router.get(
  "/:prId/inline-comments",
  authMiddleware,
  loadRepoFromPrId,
  permissionMiddleware("viewer"),
  prController.getInlineComments
);

router.delete(
  "/:prId/inline-comments/:commentId",
  authMiddleware,
  loadRepoFromPrId,
  permissionMiddleware("collaborator"),
  prController.deleteInlineComment
);

export default router;