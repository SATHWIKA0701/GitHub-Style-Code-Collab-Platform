//ActivityModel.js
import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    repoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventType: {
      type: String,
      enum: [
        "repo_created",
        "repo_deleted",
        "commit_pushed",
        "branch_created",
        "pull_request_opened",
        "pull_request_closed",
        "pull_request_reopened",
        "pull_request_merged",
        "issue_created",
        "issue_closed",
        "collaborator_added",
        "comment_added",
        "repo_archived",
        "repo_unarchived",
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("Activity", activitySchema);