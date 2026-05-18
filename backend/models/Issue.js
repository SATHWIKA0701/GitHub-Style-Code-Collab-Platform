import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Issue title must be at least 3 characters long"],
      maxlength: [120, "Issue title must be at most 120 characters long"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Issue description is too long"],
    },

    repoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
  },
  { timestamps: true }
);
issueSchema.index({
  repoId: 1,
  createdAt: -1,
});

issueSchema.index({
  repoId: 1,
  status: 1,
});

export default mongoose.model(
  "Issue",
  issueSchema
);