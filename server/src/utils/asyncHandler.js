function asyncHandler(handler) {
  return function asyncHandlerMiddleware(req, res, next) {
    return Promise.resolve(handler(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
