const { sendSuccess, sendError } = require('../utils/apiResponse');

function responseMiddleware(req, res, next) {
  res.apiSuccess = (data, message, statusCode = 200, meta = {}) => sendSuccess(res, data, message, statusCode, meta);
  res.apiError = (message, statusCode = 500, details = null) => sendError(res, message, statusCode, details);
  next();
}

module.exports = responseMiddleware;
