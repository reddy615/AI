const { body, query } = require('express-validator');

const startQuizValidator = [
  query('module').optional().isIn(['aptitude', 'reasoning', 'verbal']).withMessage('Invalid module'),
  query('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty'),
  query('category').optional().isString().trim(),
  query('count').optional().isInt({ min: 1, max: 50 }).withMessage('Count must be between 1 and 50'),
];

const submitQuizValidator = [
  body('module').isIn(['aptitude', 'reasoning', 'verbal']).withMessage('Invalid module'),
  body('answers').isObject().withMessage('Answers must be an object'),
  body('durationSeconds').optional().isInt({ min: 0 }).withMessage('Duration must be a positive integer'),
];

const createQuestionValidator = [
  body('module').isIn(['aptitude', 'reasoning', 'verbal']).withMessage('Invalid module'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('topic').trim().notEmpty().withMessage('Topic is required'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty'),
  body('text').trim().notEmpty().withMessage('Question text is required'),
  body('options').isArray({ min: 2 }).withMessage('At least two options are required'),
  body('correctIndex').isInt({ min: 0 }).withMessage('Correct index is required'),
  body('marks').optional().isFloat({ min: 0 }).withMessage('Marks must be a number'),
  body('negativeMarks').optional().isFloat({ min: 0 }).withMessage('Negative marks must be a number'),
  body('explanation').optional().isString(),
];

module.exports = { startQuizValidator, submitQuizValidator, createQuestionValidator };
