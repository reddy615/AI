const { sendError } = require('../utils/apiResponse');

function notFound(req, res) {
  return sendError(res, `Route not found: ${req.originalUrl}`, 404);
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.name === 'MulterError') {
    return sendError(res, err.message || 'File upload failed', 400);
  }

  if (err?.message?.includes('Only PDF or Word document resumes are allowed')) {
    return sendError(res, err.message, 400);
  }

  if (err?.name === 'ValidationError') {
    return sendError(res, err.message || 'Validation error', 400, err.errors);
  }

  if (err?.name === 'CastError') {
    return sendError(res, 'Invalid resource id', 400);
  }

  if (err?.code === 11000) {
    return sendError(res, 'Duplicate resource detected', 409, err.keyValue);
  }

  if (err?.statusCode) {
    return sendError(res, err.message || 'Request failed', err.statusCode, err.details || null);
  }

  console.error('[error]', err);
  return sendError(res, 'Server error', 500);
}

module.exports = { notFound, errorHandler };
