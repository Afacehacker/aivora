/**
 * Wraps async controller functions to pass errors to global error handler
 * @param {Function} fn - Async controller function
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default catchAsync;
