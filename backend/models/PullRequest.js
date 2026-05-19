import mongoose from "mongoose";

const reviewDecisionSchema =
  new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    decision: {
      type: String,
      enum: [
        "approved",
        "changes_requested",
        "commented"
      ],
      required: true
    },

    body: {
      type: String,
      default: ""
    },

    decidedAt: {
      type: Date,
      default: Date.now
    }
  });

const prCommentSchema =
  new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    body: {
      type: String,
      required: true
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  });

const inlineCommentSchema =
  new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    filePath: {
      type: String,
      required: true
    },

    lineNumber: {
      type: Number,
      required: true
    },

    body: {
      type: String,
      required: true
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  });

const pullRequestSchema =
  new mongoose.Schema(
    {
      repoName: {
        type: String,
        required: true
      },

      title: {
        type: String,
        required: true
      },

      description: {
        type: String,
        default: ""
      },

      sourceBranch: {
        type: String,
        required: true
      },

      targetBranch: {
        type: String,
        required: true
      },

      status: {
        type: String,
        enum: [
          "open",
          "closed",
          "merged"
        ],
        default: "open"
      },

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },

      reviewDecisions: [
        reviewDecisionSchema
      ],

      comments: [
        prCommentSchema
      ],

      inlineComments: [
        inlineCommentSchema
      ],

      mergedAt: {
        type: Date,
        default: null
      },

      closedAt: {
        type: Date,
        default: null
      },

      hasConflicts: {
        type: Boolean,
        default: false
      }
    },
    {
      timestamps: true
    }
  );

const PullRequest =
  mongoose.model(
    "PullRequest",
    pullRequestSchema
  );

export default PullRequest;

