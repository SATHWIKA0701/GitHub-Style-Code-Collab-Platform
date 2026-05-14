import ReviewComment from "../models/ReviewComment.js";

export const addComment = async (data, userId) => {

  const comment = new ReviewComment({
    ...data,
    userId,
  });

  await comment.save();

  return comment;
};

export const getComments = async (prId) => {

  return await ReviewComment.find({ prId });
};