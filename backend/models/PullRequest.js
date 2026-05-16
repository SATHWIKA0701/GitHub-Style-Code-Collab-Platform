import mongoose from "mongoose";

const pullRequestSchema = new mongoose.Schema(
  {
    repoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Repository",
    required: true,
  },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Pull request title must be at least 3 characters long"],
      maxlength: [120, "Pull request title must be at most 120 characters long"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, "Pull request description is too long"],
    },
    sourceBranch: { type: String, required: true, trim: true },
    targetBranch: { type: String, required: true, trim: true },
    status: { type: String, enum: ["open", "merged"], default: "open" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
pullRequestSchema.index({ repoId: 1 });
export default mongoose.model("PullRequest", pullRequestSchema);
