const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const adminController = require('../controllers/adminController');

router.use(auth, requireRole('admin'));

router.get('/summary', adminController.getSummary);
router.get('/users', adminController.listUsers);
router.patch('/users/:id', adminController.updateUser);
router.get('/users/:id/resume', adminController.getUserResume);
router.get('/questions', adminController.listQuestions);
router.get('/interviews', adminController.listInterviews);
router.get('/reports', adminController.getReports);

module.exports = router;