import PullRequest from "../models/PullRequest.js";

export const createPR = async (data) => {
  const pr = new PullRequest(data);
  await pr.save();
  return pr;
};

export const getPRs = async (repoId, skip = 0, limit = 20) => {
  const query = { repoId };
  const [data, total] = await Promise.all([
    PullRequest.find(query)
      .populate("createdBy", "_id username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    PullRequest.countDocuments(query),
  ]);
  return { data, total };
};
