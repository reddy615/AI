const connectDB = require('./src/config/db');
const dotenv = require('dotenv');
const loadEnv = require('./src/config/env');
const { connectRedis } = require('./src/config/redis');
const { Server } = require('socket.io');

dotenv.config();
const env = loadEnv();

if (env.NODE_ENV === 'production') {
  const insecureSecrets = [env.JWT_SECRET, env.ACCESS_TOKEN_SECRET, env.REFRESH_TOKEN_SECRET].some((secret) => !secret || secret.startsWith('dev_'));
  if (insecureSecrets) {
    throw new Error('Production secrets must be set for JWT_SECRET, ACCESS_TOKEN_SECRET, and REFRESH_TOKEN_SECRET');
  }
}

process.env.PORT = String(env.PORT);
process.env.MONGO_URI = env.MONGO_URI;
process.env.JWT_SECRET = env.JWT_SECRET;
process.env.ACCESS_TOKEN_SECRET = env.ACCESS_TOKEN_SECRET;
process.env.REFRESH_TOKEN_SECRET = env.REFRESH_TOKEN_SECRET;
process.env.ACCESS_TOKEN_EXPIRES_IN = env.ACCESS_TOKEN_EXPIRES_IN;
process.env.REFRESH_TOKEN_EXPIRES_IN = env.REFRESH_TOKEN_EXPIRES_IN;
process.env.CORS_ORIGIN = env.CORS_ORIGIN;
process.env.REDIS_URL = env.REDIS_URL;
process.env.COOKIE_SECURE = String(env.COOKIE_SECURE);
process.env.COOKIE_DOMAIN = env.COOKIE_DOMAIN;
process.env.RATE_LIMIT_WINDOW_MS = String(env.RATE_LIMIT_WINDOW_MS);
process.env.RATE_LIMIT_MAX = String(env.RATE_LIMIT_MAX);
process.env.AUTH_RATE_LIMIT_MAX = String(env.AUTH_RATE_LIMIT_MAX);
process.env.LOG_LEVEL = env.LOG_LEVEL;

const app = require('./src/app');
const registerInterviewSocket = require('./src/realtime/interviewSocket');

function getCorsOrigins() {
  return String(env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:4173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

Promise.all([connectDB(), connectRedis()])
  .then(() => {
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });

    const io = new Server(server, {
      cors: {
        origin: getCorsOrigins(),
        credentials: true,
      },
    });

    registerInterviewSocket(io);
    app.set('io', io);
  })
  .catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
  });