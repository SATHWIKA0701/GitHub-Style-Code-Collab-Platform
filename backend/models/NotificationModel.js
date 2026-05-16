import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    repoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repository",
      default: null,
    },

    resourceType: {
      type: String,
      enum: [
        "pr",
        "issue",
        "comment",
        "commit",
        "invitation",
      ],
      default: null,
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
  type: String,
  enum: [
    "new_pr",
    "pr_merged",
    "new_comment",
    "new_issue",
    "commit_pushed",

    "pr_reviewed",
    "issue_assigned",
    "pr_approved",
    "collaborator_added",

    "repo_invitation",
    "repo_invitation_accepted",
    "repo_invitation_declined",
  ],
  required: true,
},

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  "Notification",
  notificationSchema
);