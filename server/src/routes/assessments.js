const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const assessmentsController = require('../controllers/assessmentsController');
const { param } = require('express-validator');
const validateRequest = require('../middleware/validate');

router.get('/', auth, assessmentsController.listActiveAssessments);
router.get('/:id', auth, [param('id').isMongoId().withMessage('Valid assessment id is required')], validateRequest, assessmentsController.getAssessment);

module.exports = router;
