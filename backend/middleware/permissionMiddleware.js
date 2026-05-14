const permissionMiddleware = (requiredRole = "viewer") => {
  return (req, res, next) => {
    const repo = req.repo;
    const userId = req.user.id;

    if (!repo) {
      return res.status(500).json({ message: "Repository context not set" });
    }

    let role = null;

    if (repo.owner.toString() === userId) {
      role = "owner";
    } else {
      const collaborator = repo.collaborators.find(
        (c) => c.userId.toString() === userId
      );
      role = collaborator ? collaborator.role : null;
    }

    if (!role) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Role hierarchy: owner > collaborator > viewer
    if (requiredRole === "owner" && role !== "owner") {
      return res.status(403).json({ message: "Only owner allowed" });
    }

    if (requiredRole === "collaborator" && role === "viewer") {
      return res.status(403).json({ message: "Only collaborators or owner allowed" });
    }

    next();
  };
};

export default permissionMiddleware;