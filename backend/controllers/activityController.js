import mongoose from "mongoose";
import Activity from "../models/ActivityModel.js";

export const getRepoActivity = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repository ID",
      });
    }

    const activities = await Activity.find({ repoId: id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch repository activity",
      error: error.message,
    });
  }
};