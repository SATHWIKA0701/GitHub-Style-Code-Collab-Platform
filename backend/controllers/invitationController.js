import Invitation from "../models/Invitation.js";
import Repository from "../models/Repository.js";
import Notification from "../models/NotificationModel.js";

const INVITATION_EXPIRY_DAYS = 7;

export const sendInvitation = async (req, res) => {
  try {
    const { receiverId, role = "collaborator" } = req.body;
    const repo = req.repo;

    if (!receiverId) {
      return res.status(400).json({
        message: "User required",
      });
    }

    if (!["collaborator", "viewer"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    if (!repo) {
      return res.status(404).json({
        message: "Repository not found",
      });
    }

    if (String(repo.owner) === String(receiverId)) {
      return res.status(400).json({
        message: "Repository owner cannot be invited",
      });
    }

    const alreadyCollaborator = repo.collaborators?.some(
      (c) => String(c.userId) === String(receiverId)
    );

    if (alreadyCollaborator) {
      return res.status(400).json({
        message: "User is already a collaborator",
      });
    }

    const existing = await Invitation.findOne({
      repoId: repo._id,
      receiverId,
      status: "pending",
    });

    if (existing) {
      return res.status(400).json({
        message: "Invitation already sent",
      });
    }

    const expiresAt = new Date(
      Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    const invitation = await Invitation.create({
      repoId: repo._id,

      // your schema requires this
      invitedBy: req.user.id,

      // keeping this too because your controller/populate uses senderId
      senderId: req.user.id,

      receiverId,
      role,
      status: "pending",
      expiresAt,
    });

    await Notification.create({
      userId: receiverId,
      repoId: repo._id,
      type: "repo_invitation",
      resourceType: "invitation",
      resourceId: invitation._id,
      message: `${req.user.username || "Someone"} invited you to collaborate on ${repo.name}`,
    });

    return res.status(200).json({
      message: "Invitation sent successfully",
      invitation,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

export const getInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({
      receiverId: req.user.id,
      status: "pending",
      expiresAt: { $gt: new Date() },
    })
      .populate("repoId", "name")
      .populate("senderId", "username")
      .populate("invitedBy", "username");

    return res.json(invitations);
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

export const acceptInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);

    if (!invitation) {
      return res.status(404).json({
        message: "Invitation not found",
      });
    }

    if (String(invitation.receiverId) !== String(req.user.id)) {
      return res.status(403).json({
        message: "You are not allowed to accept this invitation",
      });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({
        message: `Invitation already ${invitation.status}`,
      });
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      invitation.status = "declined";
      await invitation.save();

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

    const alreadyExists = repo.collaborators.some(
      (c) => String(c.userId) === String(invitation.receiverId)
    );

    if (!alreadyExists) {
      repo.collaborators.push({
        userId: invitation.receiverId,
        role: invitation.role,
      });

      await repo.save();
    }

    invitation.status = "accepted";
    await invitation.save();

    await Notification.findOneAndUpdate(
      {
        resourceType: "invitation",
        resourceId: invitation._id,
        userId: invitation.receiverId,
      },
      {
        isRead: true,
      }
    );

    return res.json({
      message: "Invitation accepted",
      repoId: repo._id,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

export const declineInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);

    if (!invitation) {
      return res.status(404).json({
        message: "Invitation not found",
      });
    }

    if (String(invitation.receiverId) !== String(req.user.id)) {
      return res.status(403).json({
        message: "You are not allowed to decline this invitation",
      });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({
        message: `Invitation already ${invitation.status}`,
      });
    }

    invitation.status = "declined";
    await invitation.save();

    await Notification.findOneAndUpdate(
      {
        resourceType: "invitation",
        resourceId: invitation._id,
        userId: invitation.receiverId,
      },
      {
        isRead: true,
      }
    );

    return res.json({
      message: "Invitation declined",
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};