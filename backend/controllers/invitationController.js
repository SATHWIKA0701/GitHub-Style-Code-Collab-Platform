import mongoose from "mongoose";
import Invitation from "../models/Invitation.js";
import Repository from "../models/Repository.js";
import User from "../models/User.js";

import {
  createNotification,
  emitUserNotification,
  logActivity,
} from "../utils/eventHelpers.js";

import { asyncHandler } from "../utils/asyncHandler.js";

const populateInvitation = (query) =>
  query
    .populate("repoId", "_id name")
    .populate("invitedBy", "_id username email")
    .populate("invitedUserId", "_id username email");

export const createInvitation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { email, role = "viewer" } = req.body || {};

  if (!email) {
    return res.status(400).json({
      message: "email is required",
    });
  }

  if (!["viewer", "collaborator"].includes(role)) {
    return res.status(400).json({
      message: "Invalid role",
    });
  }

  const repo = await Repository.findById(id);

  if (!repo) {
    return res.status(404).json({
      message: "Repository not found",
    });
  }

  const invitedUser = await User.findOne({
    email: email.toLowerCase(),
  });

  if (!invitedUser) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  if (String(repo.owner) === String(invitedUser._id)) {
    return res.status(400).json({
      message: "Owner cannot be invited",
    });
  }

  const existingCollaborator = repo.collaborators.find(
    (c) => String(c.userId) === String(invitedUser._id)
  );

  if (existingCollaborator) {
    return res.status(400).json({
      message: "User is already a collaborator",
    });
  }

  const existingInvite = await Invitation.findOne({
    repoId: repo._id,
    invitedUserId: invitedUser._id,
    status: "pending",
  });

  if (existingInvite) {
    return res.status(409).json({
      message: "Pending invitation already exists",
    });
  }

  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  );

  const invitation = await Invitation.create({
    repoId: repo._id,
    invitedBy: req.user.id,
    invitedUserId: invitedUser._id,
    role,
    status: "pending",
    expiresAt,
  });

  const populated = await populateInvitation(
    Invitation.findById(invitation._id)
  );

  const notification = await createNotification({
  userId: invitedUser._id,
  repoId: repo._id,
  type: "repo_invitation",
  message: `${req.user.username} invited you to collaborate on ${repo.name}`,
  resourceType: "invitation",
  resourceId: invitation._id,
});

  emitUserNotification(invitedUser._id, {
    type: "repo_invitation",
    notification,
    invitation: populated,
  });

  await logActivity({
    repoId: repo._id,
    userId: req.user.id,
    eventType: "repo_invitation_sent",
    message: `Invitation sent to ${invitedUser.email}`,
    metadata: {
      invitationId: invitation._id,
    },
  });

  return res.status(201).json(populated);
});

export const getMyInvitations = asyncHandler(async (req, res) => {
  const invitations = await populateInvitation(
    Invitation.find({
      invitedUserId: req.user.id,
      status: "pending",
    }).sort({ createdAt: -1 })
  );

  return res.status(200).json(invitations);
});

export const acceptInvitation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const invitation = await Invitation.findById(id);

  if (!invitation) {
    return res.status(404).json({
      message: "Invitation not found",
    });
  }

  if (
    String(invitation.invitedUserId) !==
    String(req.user.id)
  ) {
    return res.status(403).json({
      message: "Not authorized",
    });
  }

  if (invitation.status !== "pending") {
    return res.status(400).json({
      message: "Invitation already processed",
    });
  }

  if (new Date() > invitation.expiresAt) {
    return res.status(400).json({
      message: "Invitation expired",
    });
  }

  const repo = await Repository.findById(invitation.repoId);

  if (!repo) {
    return res.status(404).json({
      message: "Repository not found",
    });
  }

  const alreadyExists = repo.collaborators.find(
    (c) =>
      String(c.userId) === String(req.user.id)
  );

  if (!alreadyExists) {
    repo.collaborators.push({
      userId: req.user.id,
      role: invitation.role,
    });

    await repo.save();
  }

  invitation.status = "accepted";

  await invitation.save();

  await createNotification({
    userId: invitation.invitedBy,
    repoId: repo._id,
    type: "repo_invitation_accepted",
    message: `${req.user.username} accepted your invitation`,
  });

  await logActivity({
    repoId: repo._id,
    userId: req.user.id,
    eventType: "repo_invitation_accepted",
    message: `Invitation accepted`,
    metadata: {
      invitationId: invitation._id,
    },
  });

  const populated = await populateInvitation(
    Invitation.findById(invitation._id)
  );

  return res.status(200).json(populated);
});

export const declineInvitation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const invitation = await Invitation.findById(id);

  if (!invitation) {
    return res.status(404).json({
      message: "Invitation not found",
    });
  }

  if (
    String(invitation.invitedUserId) !==
    String(req.user.id)
  ) {
    return res.status(403).json({
      message: "Not authorized",
    });
  }

  if (invitation.status !== "pending") {
    return res.status(400).json({
      message: "Invitation already processed",
    });
  }

  invitation.status = "declined";

  await invitation.save();

  const repo = await Repository.findById(
    invitation.repoId
  );

  await createNotification({
    userId: invitation.invitedBy,
    repoId: repo?._id,
    type: "repo_invitation_declined",
    message: `${req.user.username} declined your invitation`,
  });

  const populated = await populateInvitation(
    Invitation.findById(invitation._id)
  );

  return res.status(200).json(populated);
});