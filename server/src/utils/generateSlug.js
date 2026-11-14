/**
 * Generate a URL-safe slug from a title
 * @param {string} title
 * @returns {string} slug
 */
const generateSlug = (title) => {
  return title
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // Remove special characters
    .replace(/[\s_-]+/g, '-')   // Replace spaces, underscores, hyphens with single hyphen
    .replace(/^-+|-+$/g, '');   // Remove leading/trailing hyphens
};

export default generateSlug;
