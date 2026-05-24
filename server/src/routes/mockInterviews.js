const express = require('express');
const multer = require('multer');
const router = express.Router();
const auth = require('../middleware/auth');
const validateRequest = require('../middleware/validate');
const { body, param } = require('express-validator');
const mockInterviewController = require('../controllers/mockInterviewController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.post(
  '/start',
  auth,
  [body('interviewType').isIn(['hr', 'technical', 'behavioral']), body('role').optional().isString(), body('experienceLevel').optional().isString()],
  validateRequest,
  mockInterviewController.startSession,
);
router.get('/', auth, mockInterviewController.listSessions);
router.get('/:id', auth, [param('id').isMongoId()], validateRequest, mockInterviewController.getSession);
router.post('/:id/end', auth, [param('id').isMongoId()], validateRequest, mockInterviewController.endSession);
router.post('/:sessionId/transcribe', auth, upload.single('audio'), mockInterviewController.transcribeAudio);
router.post('/:sessionId/transcript', auth, mockInterviewController.processTranscript);
router.post('/:sessionId/camera', auth, mockInterviewController.recordCameraMetrics);

module.exports = router;
