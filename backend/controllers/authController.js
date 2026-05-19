import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const NODE_ENV = process.env.NODE_ENV || "development";

const buildCookieOptions = () => ({
  httpOnly: true,
  secure: NODE_ENV === "production",
  sameSite: NODE_ENV === "production" ? "Lax" : "Strict",
  maxAge: ONE_DAY_MS,
});

const toSafeUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (!username || typeof username !== "string") {
      return res.status(400).json({ message: "Username is required" });
    }
    if (username.trim().length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters long" });
    }
    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Email must be valid" });
    }
    if (!password || typeof password !== "string") {
      return res.status(400).json({ message: "Password is required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    res.status(201).json({ message: "User registered", user: toSafeUser(user) });
  } catch (err) {
    if (err && err.code === 11000) return res.status(409).json({ message: "User already exists" });
    if (err && err.name === "ValidationError") {
      const firstError = Object.values(err.errors || {})[0];
      return res.status(400).json({ message: firstError?.message || "Validation error" });
    }
    return res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || typeof email !== "string") return res.status(400).json({ message: "Email is required" });
    if (!password || typeof password !== "string") return res.status(400).json({ message: "Password is required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      {
        id: user._id.toString(),
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );
    res.cookie("token", token, buildCookieOptions());
    res.json({ message: "Login successful", user: toSafeUser(user), token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", buildCookieOptions());
  res.json({ message: "Logout successful" });
};

export const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  const repoCount = req.user.repoCount ?? undefined;
  res.json({ ...toSafeUser(user), repoCount });
};

export const updateProfile = async (req, res) => {
  const { username, email, currentPassword, newPassword } = req.body || {};
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (username !== undefined) {
    if (typeof username !== "string" || username.trim().length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters long" });
    }
    user.username = username.trim();
  }

  if (email !== undefined) {
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Email must be valid" });
    }
    const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
    if (existing) return res.status(409).json({ message: "Email already in use" });
    user.email = email.toLowerCase();
  }

  if (newPassword !== undefined) {
    if (!currentPassword) return res.status(400).json({ message: "Current password is required" });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ message: "Current password is incorrect" });
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
  }

  await user.save();
  res.json({ message: "Profile updated", user: toSafeUser(user) });
};

export const searchUsers = async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json([]);
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");
  const users = await User.find({
    $or: [{ username: regex }, { email: regex }],
    _id: { $ne: req.user.id },
  }).select("_id username email createdAt").limit(8);
  res.json(users.map((u) => ({ id: u._id, username: u.username, email: u.email, createdAt: u.createdAt })));
};

export const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select("_id username email createdAt updatedAt");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ id: user._id, username: user.username, email: user.email, createdAt: user.createdAt, updatedAt: user.updatedAt });
};
