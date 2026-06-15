const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const validateRequest = require('../middleware/validate');
const adminController = require('../controllers/adminController');
const {
  assessmentUserIdValidator,
  updateAssessmentAccessValidator,
  bulkAssessmentAccessValidator,
} = require('../validators/adminValidators');

router.use(auth, requireRole('admin'));

router.get('/summary', adminController.getSummary);
router.get('/users', adminController.listUsers);
router.patch('/users/:id', adminController.updateUser);
router.get('/assessment-access/summary', adminController.getAssessmentAccessSummary);
router.put(
  '/assessment-access/bulk',
  bulkAssessmentAccessValidator,
  validateRequest,
  adminController.bulkUpdateAssessmentAccess,
);
router.get(
  '/users/:id/assessment-access',
  assessmentUserIdValidator,
  validateRequest,
  adminController.getAssessmentAccess,
);
router.put(
  '/users/:id/assessment-access',
  updateAssessmentAccessValidator,
  validateRequest,
  adminController.updateAssessmentAccess,
);
router.post('/users/:id/send-resume-reminder', adminController.sendResumeReminder);
router.get('/users/:id/resume', adminController.getUserResume);
router.get('/questions', adminController.listQuestions);
router.get('/interviews', adminController.listInterviews);
router.get('/reports', adminController.getReports);

module.exports = router;
