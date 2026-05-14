import express from "express";
import multer from "multer";
import * as gitController from "../controllers/gitController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import permissionMiddleware from "../middleware/permissionMiddleware.js";
import Repository from "../models/Repository.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

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
router.post("/commit", authMiddleware, withRepo((req) => req.body?.repoName), permissionMiddleware("collaborator"), gitController.commit);
router.get("/repos/:repoName/commits", authMiddleware, withRepo((req) => req.params.repoName), permissionMiddleware("viewer"), gitController.getCommits);
router.post("/branch", authMiddleware, withRepo((req) => req.body?.repoName), permissionMiddleware("collaborator"), gitController.createBranch);
router.post("/checkout", authMiddleware, withRepo((req) => req.body?.repoName), permissionMiddleware("collaborator"), gitController.switchBranch);
router.post("/merge", authMiddleware, withRepo((req) => req.body?.repoName), permissionMiddleware("owner"), gitController.mergeBranch);
router.get("/diff", authMiddleware, withRepo((req) => req.query.repoName), permissionMiddleware("viewer"), gitController.getPRDiff);
router.get("/branches/:repoName", authMiddleware, withRepo((req) => req.params.repoName), permissionMiddleware("viewer"), gitController.getBranches);
router.get("/graph/:repoName", authMiddleware, withRepo((req) => req.params.repoName), permissionMiddleware("viewer"), gitController.getCommitGraph);
router.get("/files/:repoName", authMiddleware, withRepo((req) => req.params.repoName), permissionMiddleware("viewer"), gitController.getFiles);
router.put("/files", authMiddleware, withRepo((req) => req.body?.repoName), permissionMiddleware("collaborator"), gitController.saveFile);
router.post("/files/upload", authMiddleware, upload.array("files"), withRepo((req) => req.body?.repoName), permissionMiddleware("collaborator"), gitController.uploadFiles);
router.post("/files/folder", authMiddleware, withRepo((req) => req.body?.repoName), permissionMiddleware("collaborator"), gitController.createFolder);
router.delete("/files", authMiddleware, withRepo((req) => req.body?.repoName), permissionMiddleware("collaborator"), gitController.deleteFilePath);

export default router;
