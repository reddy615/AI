const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const { uploadResume, getProfile, updatePreferences, deleteResume } = require('../controllers/profileController');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
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
router.delete('/resume', auth, deleteResume);

module.exports = router;
