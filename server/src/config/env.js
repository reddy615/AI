const { cleanEnv, str, num, bool } = require('envalid');

function loadEnv() {
  return cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
    PORT: num({ default: 5000 }),
    MONGO_URI: str({ default: 'mongodb://127.0.0.1:27017/ai-interview' }),
    JWT_SECRET: str({ default: 'dev_jwt_secret_change_me' }),
    ACCESS_TOKEN_SECRET: str({ default: 'dev_access_token_secret_change_me' }),
    REFRESH_TOKEN_SECRET: str({ default: 'dev_refresh_token_secret_change_me' }),
    ACCESS_TOKEN_EXPIRES_IN: str({ default: '15m' }),
    REFRESH_TOKEN_EXPIRES_IN: str({ default: '7d' }),
    CORS_ORIGIN: str({ default: 'http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:4173' }),
    REDIS_URL: str({ default: '' }),
    AI_PROVIDER: str({ default: 'mock' }),
    OPENAI_API_KEY: str({ default: '' }),
    OPENAI_MODEL: str({ default: 'gpt-4o-mini' }),
    GEMINI_API_KEY: str({ default: '' }),
    GEMINI_MODEL: str({ default: 'gemini-1.5-flash' }),
    OPENAI_EMBEDDING_MODEL: str({ default: 'text-embedding-3-small' }),
    ML_SERVICE_URL: str({ default: '' }),
    ALLOW_INSECURE_SECRETS: bool({ default: false }),
    JUDGE0_API_URL: str({ default: '' }),
    JUDGE0_API_KEY: str({ default: '' }),
    DEEPGRAM_API_KEY: str({ default: '' }),
    DEEPGRAM_MODEL: str({ default: 'nova-2' }),
    MOCK_INTERVIEW_MODEL: str({ default: 'gpt-4o-mini' }),
    RESEND_API_KEY: str({ default: '' }),
    LEADERBOARD_CACHE_TTL_SECONDS: num({ default: 300 }),
    RECOMMENDATION_CACHE_TTL_SECONDS: num({ default: 600 }),
    RATE_LIMIT_WINDOW_MS: num({ default: 15 * 60 * 1000 }),
    RATE_LIMIT_MAX: num({ default: 100 }),
    AUTH_RATE_LIMIT_MAX: num({ default: 20 }),
    CLOUDINARY_CLOUD_NAME: str({ default: '' }),
    CLOUDINARY_API_KEY: str({ default: '' }),
    CLOUDINARY_API_SECRET: str({ default: '' }),
    COOKIE_SECURE: bool({ default: false }),
    COOKIE_DOMAIN: str({ default: '' }),
    LOG_LEVEL: str({ default: 'info' }),
  });
}

module.exports = loadEnv;
