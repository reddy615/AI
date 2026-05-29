const connectDB = require('./src/config/db');
const dotenv = require('dotenv');
const loadEnv = require('./src/config/env');
const { connectRedis } = require('./src/config/redis');
const { Server } = require('socket.io');

dotenv.config();
const defaultMongoUri = 'mongodb://127.0.0.1:27017/ai-interview';
const env = loadEnv();
const mongoUri = String(env.MONGO_URI || '').trim();
const isLocalMongoUri = !mongoUri
  || mongoUri === defaultMongoUri
  || mongoUri.includes('localhost:27017')
  || mongoUri.includes('127.0.0.1:27017');
const hasMongoUri = Boolean(mongoUri && !isLocalMongoUri);
const hasRedisUrl = Boolean(process.env.REDIS_URL && process.env.REDIS_URL.trim());

if (env.NODE_ENV === 'production') {
  const isDevSecret = (secret) => !secret || secret.startsWith('dev_');
  const insecureJwtSecret = isDevSecret(env.JWT_SECRET);
  const missingDedicatedSecrets = isDevSecret(env.ACCESS_TOKEN_SECRET) || isDevSecret(env.REFRESH_TOKEN_SECRET);
  const allowInsecure = Boolean(env.ALLOW_INSECURE_SECRETS);

  if (insecureJwtSecret && !allowInsecure) {
    console.error('Production JWT_SECRET is missing or insecure. Set JWT_SECRET in the environment.');
    console.error('To override for a non-production test deployment, set ALLOW_INSECURE_SECRETS=true (not recommended for real production).');
    process.exit(1);
  }

  if (insecureJwtSecret && allowInsecure) {
    console.warn('ALLOW_INSECURE_SECRETS=true — starting despite insecure JWT_SECRET. THIS IS NOT RECOMMENDED FOR PRODUCTION.');
  }

  if (missingDedicatedSecrets) {
    console.warn('ACCESS_TOKEN_SECRET and/or REFRESH_TOKEN_SECRET are not set to dedicated production values. Falling back to JWT_SECRET.');
  }

  if (isLocalMongoUri) {
    console.error('Production MONGO_URI is missing or points to a local MongoDB host. Set MONGO_URI to your MongoDB Atlas connection string.');
    process.exit(1);
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
const { ensureCodingChallengesSeeded } = require('./src/seed/ensureCodingChallenges');

function getCorsOrigins() {
  return String(env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:4173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const startupTasks = [];
if (hasMongoUri) {
  startupTasks.push(connectDB());
} else {
  console.warn('MONGO_URI not set — skipping MongoDB connection.');
}

if (hasRedisUrl) {
  startupTasks.push(connectRedis());
} else {
  console.warn('REDIS_URL not set — skipping Redis connection.');
}

Promise.all(startupTasks)
  .then(async () => {
    if (hasMongoUri) {
      try {
        const seedResult = await ensureCodingChallengesSeeded();
        if (seedResult.seeded) {
          console.log(`Seeded ${seedResult.count} coding challenges`);
        }
      } catch (error) {
        console.warn('Unable to auto-seed coding challenges on startup:', error.message);
      }
    }

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
    console.error('Failed to start services during startup', err);
    // If secrets or external services are missing, exit only in production unless override is set
    if (env.NODE_ENV === 'production' && !env.ALLOW_INSECURE_SECRETS) {
      process.exit(1);
    } else {
      console.warn('Continuing startup despite startup errors due to ALLOW_INSECURE_SECRETS flag.');
      const PORT = process.env.PORT || 5000;
      const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT} (partial mode)`);
      });

      const io = new Server(server, {
        cors: {
          origin: getCorsOrigins(),
          credentials: true,
        },
      });

      try {
        registerInterviewSocket(io);
        app.set('io', io);
      } catch (e) {
        console.warn('Socket registration skipped due to startup error.');
      }
    }
  });