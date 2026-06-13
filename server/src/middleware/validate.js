const { validationResult } = require('express-validator');

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((error) => error.msg).join('; ');
    return res.status(400).json({
      success: false,
      message: messages || 'Invalid input',
      errors: errors.array(),
    });
  }
  next();
}

module.exports = validateRequest;
