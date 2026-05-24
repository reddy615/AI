const { body, query } = require('express-validator');

const generateQuestionsValidator = [
  body('module').isIn(['aptitude', 'reasoning', 'verbal', 'hr', 'technical']).withMessage('Invalid module'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty'),
  body('count').optional().isInt({ min: 1, max: 20 }).withMessage('Count must be between 1 and 20'),
  body('candidateProfile').optional().isObject(),
];

const listAIQuestionsValidator = [
  query('module').optional().isIn(['aptitude', 'reasoning', 'verbal', 'hr', 'technical']),
  query('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = { generateQuestionsValidator, listAIQuestionsValidator };
