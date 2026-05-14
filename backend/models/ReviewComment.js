import mongoose from "mongoose";

const reviewCommentSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  prId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PullRequest",
    required: true
  },

  filePath: String,

  lineNumber: {
    type: Number,
    min: [1, "lineNumber must be >= 1"],
  },

  comment: {
    type: String,
    required: true,
    trim: true,
    minlength: [1, "Comment cannot be empty"],
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

export default mongoose.model("ReviewComment", reviewCommentSchema);