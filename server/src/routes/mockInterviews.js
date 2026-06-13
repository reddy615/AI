const express = require('express');
const multer = require('multer');
const router = express.Router();
const auth = require('../middleware/auth');
const validateRequest = require('../middleware/validate');
const { body, param } = require('express-validator');
const mockInterviewController = require('../controllers/mockInterviewController');
const { requireAssessmentAccess } = require('../middleware/assessmentAccess');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.post(
  '/start',
  auth,
  requireAssessmentAccess('mockInterview'),
  [body('interviewType').isIn(['hr', 'technical', 'behavioral']), body('role').optional().isString(), body('experienceLevel').optional().isString()],
  validateRequest,
  mockInterviewController.startSession,
);
router.get('/', auth, mockInterviewController.listSessions);
router.get('/:id', auth, [param('id').isMongoId()], validateRequest, mockInterviewController.getSession);
router.post('/:id/end', auth, requireAssessmentAccess('mockInterview'), [param('id').isMongoId()], validateRequest, mockInterviewController.endSession);
router.post('/:sessionId/transcribe', auth, requireAssessmentAccess('mockInterview'), upload.single('audio'), mockInterviewController.transcribeAudio);
router.post('/:sessionId/transcript', auth, requireAssessmentAccess('mockInterview'), mockInterviewController.processTranscript);
router.post('/:sessionId/camera', auth, requireAssessmentAccess('mockInterview'), mockInterviewController.recordCameraMetrics);

module.exports = router;
