# AWS Deployment Architecture

## Overview

Production runs on a single EC2 instance for the web tier, with managed external services for data and caching:

- React frontend built into static files and served by Nginx with CDN-friendly caching headers.
- Node.js API managed by PM2 in cluster mode on EC2.
- FastAPI recommendation service running on the same host on port 8000 or in a separate container, fronted by Nginx.
- MongoDB Atlas for the primary database.
- Redis for caching, rate-limiting support, and recommendation/leaderboard cache invalidation.

## AWS Components

- EC2: Ubuntu 22.04, security group open only to 22 from your IP, 80/443 to the internet.
- Elastic IP: optional, recommended for stable DNS.
- Route 53: point your domain to the EC2 public IP or load balancer.
- ACM/Let’s Encrypt: use Let’s Encrypt on EC2, or ACM if terminating TLS at an AWS load balancer.
- CloudWatch: centralize logs and alarms.

## Deployment Flow

1. Build the React frontend in GitHub Actions.
2. Build or package the Node and FastAPI services.
3. SSH into EC2.
4. Pull the latest commit or deploy artifact.
5. Install dependencies if needed.
6. Build the client bundle.
7. Reload PM2 with zero downtime.
8. Reload Nginx.

## EC2 Setup Steps

1. Launch an Ubuntu 22.04 EC2 instance.
2. Attach a security group that allows 22, 80, and 443.
3. Install Node.js 20, Python 3.11, Nginx, PM2, Docker, Docker Compose, and Certbot.
4. Clone the repository into `/var/www/ai-interview`.
5. Copy `deploy/aws/environment.production.example` to `.env` and fill production secrets.
6. Configure Nginx with `deploy/aws/nginx/ai-interview.conf`.
7. Issue TLS certificates with Certbot.
8. Start the FastAPI ML service and Node API.
9. Build the client and serve it through Nginx.

## Zero Downtime Strategy

- Use PM2 cluster mode for the Node.js API.
- Use Nginx as the stable front door so the static frontend and APIs are always available.
- Reload PM2 instead of restarting the host process.
- Keep the FastAPI service isolated so it can be restarted without taking down the Node app.

## Security Controls

- Enforce HTTPS with HSTS.
- Terminate TLS at Nginx.
- Use production CORS with explicit origins only.
- Apply rate limiting in Express and at Nginx where appropriate.
- Restrict EC2 inbound rules to required ports only.
- Store secrets in SSM Parameter Store or AWS Secrets Manager when moving beyond the initial EC2 setup.

## Logging and Monitoring

- Ship Nginx, PM2, and app logs to CloudWatch Agent.
- Expose `/health` and `/ready` endpoints.
- Scrape app metrics with Prometheus and visualize in Grafana.
- Add alarms for CPU, memory, disk, 5xx rate, and process restarts.

## Recommended Production Services

- MongoDB Atlas: multi-region or at least backed up daily.
- Redis: AWS ElastiCache if you want managed Redis.
- Optional CDN: CloudFront in front of Nginx or S3-hosted static assets if you split the frontend away from the EC2 box.