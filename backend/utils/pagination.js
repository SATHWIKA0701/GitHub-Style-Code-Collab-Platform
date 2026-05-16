/**
 * Parses query parameters to return standardized pagination values.
 * Ensures the page is at least 1 and limit is between 1 and 100.
 * 
 * @param {Object} query - Express request query object
 * @returns {Object} { page, limit, skip } values for database queries
 */
export const getPagination = (query) => {
  // Parse page, default to 1, ensure it's at least 1
  const page = Math.max(parseInt(query.page) || 1, 1);
  
  // Parse limit, default to 20, ensure it's between 1 and 100
  const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 100);
  
  // Calculate skip for MongoDB or array slicing
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};
