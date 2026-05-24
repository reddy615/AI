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
