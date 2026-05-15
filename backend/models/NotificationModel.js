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
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["new_pr", "pr_merged", "new_comment", "new_issue", "commit_pushed"],
      required: true,
    },
    resourceType: {
      type: String,
      enum: ["pr", "issue", "commit", "repo"]
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
notificationSchema.index({
  userId: 1,
  isRead: 1,
  createdAt: -1
});

export default mongoose.model("Notification", notificationSchema);