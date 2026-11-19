// Centralized Error Handling Middleware
// Express recognizes this as an error handler because it has 4 parameters: (err, req, res, next)
const errorHandler = (err, req, res, next) => {
  // Use status code from error object if available, otherwise default to 500 (Internal Server Error)
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  // Send consistent JSON error response
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Do not expose stack traces or technical details in production
    error: process.env.NODE_ENV === 'production' ? null : (err.details || err.message),
  });
};

module.exports = errorHandler;
