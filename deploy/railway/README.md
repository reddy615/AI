Railway backend deployment guide

1) Create a new Railway project and select Dockerfile option. Point the root to the `server` folder or use the repo root and set the service root to `server`.

2) Set the build & start commands (Railway generally detects Dockerfile builds). If Railway needs a start command, use:

node server.js

3) Environment variables
Use `deploy/railway/environment.production.example` as a template. Key vars:
- `MONGO_URI`: MongoDB Atlas connection string (mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority)
- `REDIS_URL`: Managed Redis endpoint (rediss://... or redis://...)
- `ML_SERVICE_URL`: Public URL for the ml-service (deployed separately)
- `JWT_SECRET`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`: strong secrets
- `CORS_ORIGIN`: your client URL (Vercel or custom domain)
- `VITE_API_URL`: public backend URL for client

4) Networking
- Allow Railway's IPs in Atlas IP whitelist or use an Atlas User/Network Peering solution.

5) Healthcheck
Configure Railway health check path to `/health` and port `5000`.

6) Logs & debugging
- If build fails on Railway with native modules, switch base image to `node:20-slim` (already set in this repo) and ensure any required system libs are installed in the Dockerfile.

7) Secrets management
Use Railway's environment variable UI to set secrets (do not commit secrets to Git).

8) Post-deploy
- Verify `/health` and `/ready`.
- Register a test user and confirm persistence in Atlas.
