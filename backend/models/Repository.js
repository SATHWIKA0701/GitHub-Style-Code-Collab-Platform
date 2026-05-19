//Repository.js
import mongoose from "mongoose";

const collaboratorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId,
     ref: "User" },
    role: { type: String,
     enum: ["owner", "collaborator", "viewer"], 
     default: "viewer" },
});

const repositorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Repository name must be at least 3 characters long"],
      maxlength: [60, "Repository name must be at most 60 characters long"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Repository description must be at most 500 characters long"],
      default: "",
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },
    defaultBranch: {
      type: String,
      trim: true,
      default: "main",
    },
    issueCount: {
      type: Number,
      default: 0,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    collaborators: [collaboratorSchema],
    status: {
      type: String,
      enum: ["open", "merged", "closed"],
      default: "open",
    },
    mergedAt: Date,
    closedAt: Date,
    reviewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    reviewDecisions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        decision: {
          type: String,
          enum: ["approved", "changes_requested", "commented"],
        },
        body: String,
        decidedAt: Date,
      },
    ],
  },
  { timestamps: true }
);
repositorySchema.index(
  { owner: 1, name: 1 },
  { unique: true }
);
repositorySchema.index({
  owner: 1,
  updatedAt: -1,
});

repositorySchema.index({
  "collaborators.userId": 1,
});
export default mongoose.model("Repository", repositorySchema);
