import mongoose from "mongoose";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: [3, "Username must be at least 3 characters long"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [emailRegex, "Email must be a valid email address (include @)"],
    },
    password: {
      type: String,
      required: true,
      minlength: [6, "Password must be at least 6 characters long"],
    },
    avatar: {
      type: String,
      default: ""
    },
    bio: {
      type: String,
      maxlength: 200,
      default: ""
    },
    location: {
      type: String,
      maxlength: 100,
      default: ""
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);