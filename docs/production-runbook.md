# Production Runbook

## Prerequisites

- EC2 Ubuntu 22.04 instance
- MongoDB Atlas cluster
- Redis instance or ElastiCache cluster
- Domain name pointed to the EC2 host
- GitHub repository secrets for deploy credentials

## Environment Variables

Copy `deploy/aws/environment.production.example` and replace all placeholder values.

## Build and Start

```bash
cd /var/www/ai-interview/server
npm install
npm run start:prod

cd /var/www/ai-interview/client
npm install
npm run build

cd /var/www/ai-interview/ml-service
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

## PM2

- Start: `npm run start:prod`
- Reload: `npm run pm2:reload`
- Status: `pm2 status`
- Logs: `pm2 logs ai-interview-server`

## Nginx

- Copy `deploy/aws/nginx/ai-interview.conf` into `/etc/nginx/sites-available/ai-interview.conf`
- Enable the site and reload Nginx

## Health Checks

- `GET /health`
- `GET /ready`
- `GET /api/gamification/leaderboard`

## Rollback

1. Revert to the previous git commit.
2. Reload PM2 with the previous build.
3. Reload Nginx if the config changed.
4. Verify `/health` and `/ready`.