# AI Interview Preparation Platform

This repository now includes the full stage-4 scaling surface for the product:

- Recommendation engine with Redis caching and optional FastAPI/OpenAI embeddings support
- Gamification with XP, streaks, badges, and leaderboards
- Multi-language UI support with persisted preferences
- Admin dashboard and platform reporting
- Production deployment scaffolding for Docker, Nginx, AWS-ready container builds, and GitHub Actions

Folders:
- `server/` — Express + MongoDB backend
- `client/` — React + Tailwind frontend
- `ml-service/` — FastAPI recommendation service

Production entry points:
- `docker-compose.prod.yml`
- `client/nginx.conf`
- `server/Dockerfile`
- `client/Dockerfile`
- `ml-service/Dockerfile`
- `.github/workflows/ci-cd.yml`

See the server README for API routes and environment variables.

## Railway deployment

This repository is a monorepo, so Railway should not build from the repo root.
Create separate Railway services and set each service's root directory to the
matching subfolder:

- Backend API: `server`
- Frontend client: `client`
- ML service: `ml-service`

Railway can then use the Dockerfile inside each folder. The backend service
expects these core environment variables in production:

- `NODE_ENV=production`
- `PORT=5000`
- `MONGO_URI`
- `JWT_SECRET`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`

If you enable Redis or the FastAPI recommendation service, also set:

- `REDIS_URL`
- `ML_SERVICE_URL`

If the frontend and backend are separate Railway services, add the frontend
service URL to the backend's `CORS_ORIGIN` value.

For the client service, set `VITE_API_URL` to the public backend URL, for
example the Railway URL of the `server` service. The client container now reads
that value at runtime, so the same image works in Railway and locally.
