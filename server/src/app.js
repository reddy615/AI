const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const client = require('prom-client');
const morgan = require('./middleware/logger');
const responseMiddleware = require('./middleware/response');
const { generalLimiter } = require('./middleware/rateLimiters');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const quizRoutes = require('./routes/quiz');
const aiRoutes = require('./routes/ai');
const codingRoutes = require('./routes/coding');
const analyticsRoutes = require('./routes/analytics');
const mockInterviewRoutes = require('./routes/mockInterviews');
const recommendationRoutes = require('./routes/recommendations');
const gamificationRoutes = require('./routes/gamification');
const adminRoutes = require('./routes/admin');

client.collectDefaultMetrics({ prefix: 'ai_interview_' });
const httpRequestDuration = new client.Histogram({
	name: 'http_request_duration_seconds',
	help: 'HTTP request latency in seconds',
	labelNames: ['method', 'route', 'status_code'],
	buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

const app = express();

function getCorsOrigins() {
	return String(process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:4173')
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean);
}

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: getCorsOrigins(), credentials: true }));
app.use(compression());
app.use(cookieParser());
app.use(morgan);
app.use(responseMiddleware);
app.use(generalLimiter);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(mongoSanitize());
app.use(xssClean());
app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
	const end = httpRequestDuration.startTimer();
	res.on('finish', () => {
		end({
			method: req.method,
			route: req.route?.path || req.path,
			status_code: String(res.statusCode),
		});
	});
	next();
});

app.get('/health', (req, res) => {
	res.status(200).json({
		success: true,
		status: 'ok',
		uptime: process.uptime(),
		timestamp: new Date().toISOString(),
	});
});

app.get('/ready', (req, res) => {
	res.status(200).json({
		success: true,
		status: 'ready',
	});
});

app.get('/metrics', async (req, res) => {
	res.set('Content-Type', client.register.contentType);
	res.end(await client.register.metrics());
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mock-interviews', mockInterviewRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
