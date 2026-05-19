const permissionMiddleware = (requiredRole = "viewer") => {
  return (req, res, next) => {
    const repo = req.repo;
    const userId = req.user.id;

    if (!repo) {
      return res.status(500).json({
        message: "Repository context not set",
      });
    }

    let role = null;

    // Owner check
    if (repo.owner.toString() === userId) {
      role = "owner";
    } else {
      // Collaborator check
      const collaborator = repo.collaborators.find(
        (c) => c.userId.toString() === userId
      );

      role = collaborator ? collaborator.role : null;
    }

    // Public repositories give viewer access
    if (!role && repo.visibility === "public") {
      role = "viewer";
    }

    if (!role) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    // Role hierarchy
    const hierarchy = {
      viewer: 0,
      collaborator: 1,
      owner: 2,
    };

    if (hierarchy[role] < hierarchy[requiredRole]) {
      return res.status(403).json({
        message: "Insufficient permissions",
      });
    }

    // Attach role for later use
    req.userRole = role;

    next();
  };
};

export default permissionMiddleware;