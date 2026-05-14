import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  const tokenFromCookie = req.cookies?.token;
  const authHeader = req.headers?.authorization;
  const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = tokenFromCookie || bearerToken;

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
    };

    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid token" });
  }
};

export default authMiddleware;