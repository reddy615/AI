const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const adminController = require('../controllers/adminController');
const mongoose = require('mongoose');

const ADMIN_DEBUG_LOGS = process.env.ADMIN_DEBUG_LOGS === 'true';

router.use(auth, requireRole('admin'));

router.use((req, res, next) => {
	if (ADMIN_DEBUG_LOGS) {
		console.info('[admin:route:start]', {
			method: req.method,
			path: req.originalUrl,
			mongoState: mongoose.connection.readyState,
			userId: req.user?.id,
		});

		res.on('finish', () => {
			console.info('[admin:route:end]', {
				method: req.method,
				path: req.originalUrl,
				statusCode: res.statusCode,
				mongoState: mongoose.connection.readyState,
			});
		});
	}

	next();
});

router.get('/summary', adminController.getSummary);
router.get('/users', adminController.listUsers);
router.patch('/users/:id', adminController.updateUser);
router.get('/questions', adminController.listQuestions);
router.get('/interviews', adminController.listInterviews);
router.get('/reports', adminController.getReports);

module.exports = router;