# Server — AI Interview Prep (Stage 1)

Install and run:

```bash
cd server
npm install
cp .env.example .env
# edit .env to set MONGO_URI and the JWT/Redis/cookie settings you want
npm run dev
```

Stage 2 AI and coding settings are also supported through these env vars:
- `AI_PROVIDER` = `mock`, `openai`, or `gemini`
- `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_EMBEDDING_MODEL`
- `GEMINI_API_KEY`, `GEMINI_MODEL`
- `JUDGE0_API_URL`, `JUDGE0_API_KEY`

Stage 3 mock interview settings:
- `DEEPGRAM_API_KEY`, `DEEPGRAM_MODEL`
- `MOCK_INTERVIEW_MODEL`

Stage 4 scaling settings:
- `REDIS_URL`
- `ML_SERVICE_URL`
- `LEADERBOARD_CACHE_TTL_SECONDS`
- `RECOMMENDATION_CACHE_TTL_SECONDS`
- `COOKIE_SECURE`, `COOKIE_DOMAIN`
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`

New stage 4 routes:
- `GET /health` and `GET /ready`
- `GET /api/recommendations/personalized`
- `GET /api/gamification/me`
- `GET /api/gamification/leaderboard`
- `GET /api/admin/summary`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id`
- `GET /api/admin/questions`
- `GET /api/admin/interviews`
- `GET /api/admin/reports`
- `PUT /api/profile/preferences`

Recommended local production stack:

```bash
docker compose -f ../docker-compose.prod.yml up --build
```

The FastAPI recommendation service is in `../ml-service/` and can be run independently with Uvicorn.

## Railway deployment notes

When deploying the backend to Railway, set the service root directory to
`server` so Railway builds from this folder instead of the repository root.
The backend Dockerfile and startup script already expect to run from here.

Required production environment variables:

- `NODE_ENV=production`
- `PORT=5000`
- `MONGO_URI` should point to MongoDB Atlas, not `localhost`
- `JWT_SECRET`

Optional but recommended for token isolation:

- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`

Optional stage 4 variables:

- `REDIS_URL`
- `ML_SERVICE_URL`
- `COOKIE_SECURE=true` when serving over HTTPS
- `COOKIE_DOMAIN` when you need a shared cookie domain
- `CORS_ORIGIN` should include the frontend Railway URL when the UI is deployed separately

If you deploy the frontend as a separate Railway service, set the frontend's
`VITE_API_URL` to the public backend URL of this service.

The recommended Railway backend variable template is in
`deploy/railway/environment.production.example`.

Using Docker for MongoDB (recommended for local testing):

```bash
cd server
docker compose up -d
# wait a couple seconds for Mongo to start, then:
npm run seed
```

The seed script inserts sample questions into MongoDB. Use `npm run seed -- --force` to reseed.

API endpoints:
- `POST /api/auth/register` — register
- `POST /api/auth/login` — login
- `POST /api/auth/refresh` — rotate refresh token
- `POST /api/auth/logout` — revoke refresh token version
- `GET /api/auth/me` — get profile (requires `Authorization: Bearer <token>`)
- `POST /api/profile/resume` — upload resume (form field `resume`)
- `GET /api/quiz/start` — fetch randomized quiz questions
- `POST /api/quiz/submit` — submit answers
- `GET /api/quiz/history` — list attempts
- `GET /api/quiz/result/:id` — get attempt analytics
- `POST /api/quiz/question` — create question as admin
- `POST /api/ai/generate` — generate AI questions
- `GET /api/ai/questions` — list generated AI questions
- `POST /api/ai/recommendations` — generate recommendations
- `GET /api/coding/challenges` — list coding challenges
- `GET /api/coding/challenges/:id` — get a coding challenge
- `POST /api/coding/run` — run coding submission
- `GET /api/coding/leaderboard` — coding leaderboard
- `POST /api/coding/challenges` — create coding challenge as admin
- `GET /api/analytics/overview` — analytics overview
- `GET /api/analytics/trends` — performance trends
- `GET /api/analytics/recommendations` — personalized recommendations
- `POST /api/mock-interviews/start` — create a live interview session
- `GET /api/mock-interviews` — list sessions
- `GET /api/mock-interviews/:id` — load a session
- `POST /api/mock-interviews/:id/end` — finish a session
- `POST /api/mock-interviews/:sessionId/transcribe` — transcribe an uploaded audio blob
- `POST /api/mock-interviews/:sessionId/transcript` — score a transcript
- `POST /api/mock-interviews/:sessionId/camera` — score camera metrics
