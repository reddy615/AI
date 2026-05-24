const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const { uploadResume, getProfile, updatePreferences } = require('../controllers/profileController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split('.').pop();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only PDF or Word document resumes are allowed'));
    }
    cb(null, true);
  },
});

router.get('/', auth, getProfile);
router.put('/preferences', auth, updatePreferences);
router.post('/resume', auth, upload.single('resume'), uploadResume);

module.exports = router;
