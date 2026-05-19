import Label from "../models/Label.js";
import Repository from "../models/Repository.js";

export const getLabels = async (req, res) => {
  const { id } = req.params;
  const labels = await Label.find({ repoId: id }).sort({ name: 1 });
  res.status(200).json(labels);
};

export const createLabel = async (req, res) => {
  const { id } = req.params;
  const { name, color, description } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ message: "Label name is required" });
  }
  if (!color || typeof color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return res.status(400).json({ message: "Valid hex color is required (e.g. #ff0000)" });
  }

  const existing = await Label.findOne({ repoId: id, name: name.trim() });
  if (existing) {
    return res.status(409).json({ message: "Label already exists in this repository" });
  }

  const label = await Label.create({
    repoId: id,
    name: name.trim(),
    color: color.trim().toLowerCase(),
    description: description ? String(description).trim() : "",
  });

  res.status(201).json(label);
};

export const updateLabel = async (req, res) => {
  const { id, labelId } = req.params;
  const { name, color, description } = req.body;

  const label = await Label.findOne({ _id: labelId, repoId: id });
  if (!label) {
    return res.status(404).json({ message: "Label not found" });
  }

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) return res.status(400).json({ message: "Invalid name" });
    const existing = await Label.findOne({ repoId: id, name: name.trim(), _id: { $ne: labelId } });
    if (existing) return res.status(409).json({ message: "Label name already exists" });
    label.name = name.trim();
  }

  if (color !== undefined) {
    if (typeof color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(color)) {
      return res.status(400).json({ message: "Valid hex color is required" });
    }
    label.color = color.trim().toLowerCase();
  }

  if (description !== undefined) {
    label.description = String(description).trim();
  }

  await label.save();
  res.status(200).json(label);
};

export const deleteLabel = async (req, res) => {
  const { id, labelId } = req.params;
  const label = await Label.findOneAndDelete({ _id: labelId, repoId: id });
  
  if (!label) {
    return res.status(404).json({ message: "Label not found" });
  }

  res.status(200).json({ message: "Label deleted" });
};
