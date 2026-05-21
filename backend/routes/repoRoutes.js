//repoRoutes.js
import express from "express";
import {
  createRepo,
  getAllRepos,
  getRepoById,
  deleteRepo,
  addCollaborator,
  removeCollaborator,
  updateCollaboratorRole,
  getPublicRepos,
  getRepoByAlias,
  toggleArchiveRepo,
} from "../controllers/repoController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import permissionMiddleware from "../middleware/permissionMiddleware.js";
import Repository from "../models/Repository.js";

const router = express.Router();

const loadRepoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const repo = await Repository.findById(id);
    if (!repo) {
      return res.status(404).json({ message: "Repository not found" });
    }
    req.repo = repo;
    next();
  } catch (err) {
    next(err);
  }
};

// Public routes
router.get("/public", getPublicRepos);

// Protected routes
router.post("/", authMiddleware, createRepo);
router.delete("/:id", authMiddleware, deleteRepo);

// Collaborator management
router.post(
  "/:id/collaborators",
  authMiddleware,
  loadRepoById,
  permissionMiddleware("owner"),
  addCollaborator
);
router.delete(
  "/:id/collaborators/:userId",
  authMiddleware,
  loadRepoById,
  permissionMiddleware("owner"),
  removeCollaborator
);
router.put(
  "/:id/collaborators/:userId",
  authMiddleware,
  loadRepoById,
  permissionMiddleware("owner"),
  updateCollaboratorRole
);

// Archive management
router.put(
  "/:id/archive",
  authMiddleware,
  loadRepoById,
  permissionMiddleware("owner"),
  toggleArchiveRepo
);

// Protected reads
router.get("/", authMiddleware, getAllRepos);
router.get("/alias/:username/:repoName", authMiddleware, getRepoByAlias);
router.get("/:id", authMiddleware, loadRepoById, permissionMiddleware("viewer"), getRepoById);

export default router;