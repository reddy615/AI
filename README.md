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
expects these core environment variables in production, with `MONGO_URI` set to
your MongoDB Atlas connection string rather than a local MongoDB host:

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

Use `deploy/railway/environment.production.example` as the starting point for
the backend service variables.

## Resume analyzer

The project includes a premium resume analyzer workflow with upload, AI review, history, and PDF report export.

- Upload resumes from `client/src/pages/Resume.jsx`
- Generate analysis via `POST /api/resume/analyze`
- Review saved results at `/resume/analytics`
- Download a premium multi-page PDF report from the dashboard

Ensure Cloudinary resume storage is configured with:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Testing

Run the backend server smoke tests from the repository root:

```bash
npm test
```

This starts a temporary server and verifies the API health endpoints and readiness checks.
