import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import permissionMiddleware from "../middleware/permissionMiddleware.js";

import Repository from "../models/Repository.js";

import {
  createInvitation,
  getMyInvitations,
  acceptInvitation,
  declineInvitation,
} from "../controllers/invitationController.js";

const router = express.Router();

const loadRepoById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const repo = await Repository.findById(id);

    if (!repo) {
      return res.status(404).json({
        message: "Repository not found",
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
  loadRepoById,
  permissionMiddleware("owner"),
  createInvitation
);

router.get(
  "/invitations",
  authMiddleware,
  getMyInvitations
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