const archiveMiddleware = (req, res, next) => {
  const repo = req.repo;

  if (!repo) {
    return res.status(500).json({
      message: "Repository context not set",
    });
  }

  if (repo.isArchived) {
    return res.status(403).json({
      message: "Repository is archived and read-only",
    });
  }

  next();
};

export default archiveMiddleware;