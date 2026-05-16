import ReviewComment from "../models/ReviewComment.js";

export const addComment = async (data, userId) => {

  const comment = new ReviewComment({
    ...data,
    userId,
  });

  await comment.save();

  return comment;
};

export const getComments = async (prId, skip = 0, limit = 20) => {
  const query = { prId };
  const [data, total] = await Promise.all([
    ReviewComment.find(query)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit),
    ReviewComment.countDocuments(query),
  ]);
  return { data, total };
};