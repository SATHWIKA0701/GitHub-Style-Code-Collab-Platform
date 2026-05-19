import mongoose from "mongoose";

const labelSchema = new mongoose.Schema(
  {
    repoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
      match: /^#[0-9a-fA-F]{6}$/, // validates hex color
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

labelSchema.index({ repoId: 1, name: 1 }, { unique: true });

export default mongoose.model("Label", labelSchema);
