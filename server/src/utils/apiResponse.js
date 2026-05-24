function sendSuccess(res, data = null, message = 'OK', statusCode = 200, meta = {}) {
  const payload = {
    success: true,
    message,
    data,
    meta,
  };

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    Object.assign(payload, data);
  }

  return res.status(statusCode).json(payload);
}

function sendError(res, message = 'Server error', statusCode = 500, details = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    details,
  });
}

module.exports = { sendSuccess, sendError };
