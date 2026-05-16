import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    repoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    invitedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: ["viewer", "collaborator"],
      default: "viewer",
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

invitationSchema.index(
  {
    repoId: 1,
    invitedUserId: 1,
    status: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: "pending",
    },
  }
);

export default mongoose.model("Invitation", invitationSchema);