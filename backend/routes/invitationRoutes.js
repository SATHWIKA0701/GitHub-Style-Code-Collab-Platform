import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  sendInvitation,
  getInvitations,
  acceptInvitation,
  declineInvitation,
} from "../controllers/invitationController.js";

import Repository from "../models/Repository.js";

const router = express.Router();

const loadRepo = async (
  req,
  res,
  next
) => {
  try {
    const repo =
      await Repository.findById(
        req.params.id
      );

    if (!repo) {
      return res.status(404).json({
        message:
          "Repository not found",
      });
    }

    req.repo = repo;

    next();
  } catch (err) {
    next(err);
  }
};

router.post(
  "/repos/:id/invitations",
  authMiddleware,
  loadRepo,
  sendInvitation
);

router.get(
  "/invitations",
  authMiddleware,
  getInvitations
);

router.put(
  "/invitations/:id/accept",
  authMiddleware,
  acceptInvitation
);

router.put(
  "/invitations/:id/decline",
  authMiddleware,
  declineInvitation
);

export default router;