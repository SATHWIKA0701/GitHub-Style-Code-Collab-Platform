//gitRoutes.js
import express from "express";
import multer from "multer";
import * as gitController from "../controllers/gitController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import permissionMiddleware from "../middleware/permissionMiddleware.js";
import Repository from "../models/Repository.js";
import archiveMiddleware from "../middleware/archiveMiddleware.js";
import { uploadLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();
const allowedExtensions = [
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".md",
  ".txt",
  ".html",
  ".css",
  ".scss",
  ".py",
  ".java",
  ".cpp",
  ".c",
  ".h",
  ".yml",
  ".yaml",
  ".xml",
];

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5,
  },

  fileFilter: (req, file, cb) => {
    const extension = file.originalname
      .substring(file.originalname.lastIndexOf("."))
      .toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      return cb(
        new Error(`File type ${extension} is not allowed`)
      );
    }

    cb(null, true);
  },
});
const loadRepoByName = async (repoName) => {
  if (!repoName) throw new Error("repoName is required");
  const repo = await Repository.findOne({ name: String(repoName).trim() });
  if (!repo) {
    const err = new Error("Repository not found");
    err.status = 404;
    throw err;
  }
  return repo;
};

const withRepo = (resolver) => async (req, res, next) => {
  try {
    req.repo = await loadRepoByName(resolver(req));
    next();
  } catch (error) { next(error); }
};

router.post("/repo/init", authMiddleware, gitController.createRepo);
router.post("/commit", authMiddleware, withRepo((req) => req.body?.repoName), permissionMiddleware("collaborator"), archiveMiddleware, gitController.commit);
router.get("/repos/:repoName/commits", authMiddleware, withRepo((req) => req.params.repoName), permissionMiddleware("viewer"), gitController.getCommits);
router.get(
  "/repos/:repoName/structured-commits",
  authMiddleware,
  withRepo((req) => req.params.repoName),
  permissionMiddleware("viewer"),
  gitController.getStructuredCommits
);

router.get(
  "/repos/:repoName/commits/:sha",
  authMiddleware,
  withRepo((req) => req.params.repoName),
  permissionMiddleware("viewer"),
  gitController.getCommitDetails
);

router.post("/branch", authMiddleware, withRepo((req) => req.body?.repoName), permissionMiddleware("collaborator"), archiveMiddleware, gitController.createBranch);
router.post("/checkout", authMiddleware, withRepo((req) => req.body?.repoName), permissionMiddleware("collaborator"), archiveMiddleware, gitController.switchBranch);
router.post("/merge", authMiddleware, withRepo((req) => req.body?.repoName), permissionMiddleware("owner"), archiveMiddleware, gitController.mergeBranch);
router.get("/diff", authMiddleware, withRepo((req) => req.query.repoName), permissionMiddleware("viewer"), gitController.getPRDiff);
router.get("/branches/:repoName", authMiddleware, withRepo((req) => req.params.repoName), permissionMiddleware("viewer"), gitController.getBranches);
router.get("/graph/:repoName", authMiddleware, withRepo((req) => req.params.repoName), permissionMiddleware("viewer"), gitController.getCommitGraph);
router.get("/files/:repoName", authMiddleware, withRepo((req) => req.params.repoName), permissionMiddleware("viewer"), gitController.getFiles);
router.post(
  "/files/commit",
  authMiddleware,
  withRepo((req) => req.body?.repoName),
  permissionMiddleware("collaborator"),
  archiveMiddleware,
  gitController.saveFileWithCommit
);
router.put("/files", authMiddleware, withRepo((req) => req.body?.repoName), permissionMiddleware("collaborator"), archiveMiddleware, gitController.saveFile);
router.post(
  "/files/upload",
  uploadLimiter,
  authMiddleware,
  upload.array("files"),
  withRepo((req) => req.body?.repoName),
  permissionMiddleware("collaborator"),
  archiveMiddleware,
  gitController.uploadFiles
);
router.post("/files/folder", authMiddleware, withRepo((req) => req.body?.repoName), permissionMiddleware("collaborator"), archiveMiddleware, gitController.createFolder);
router.delete("/files", authMiddleware, withRepo((req) => req.body?.repoName), permissionMiddleware("collaborator"), archiveMiddleware, gitController.deleteFilePath);

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large. Maximum allowed size is 10MB per file.",
      });
    }

    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        error: "Too many files. Maximum 5 files can be uploaded at once.",
      });
    }

    return res.status(400).json({
      error: error.message,
    });
  }

  if (error.message?.includes("not allowed")) {
  return res.status(400).json({
    error: error.message,
  });
}
  next(error);
});

export default router;
