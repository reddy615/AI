# Root Dockerfile for single-service deployment: builds client and server

FROM node:20-alpine as builder
WORKDIR /app

# Install client deps and build
COPY client/package*.json ./client/
RUN cd client && npm install --no-audit --no-fund
COPY client ./client
RUN cd client && npm run build

# Install server deps
FROM node:20-alpine as runtime
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev --no-audit --no-fund
COPY server ./server
# Copy built client dist into server path
COPY --from=builder /app/client/dist /app/client/dist

ENV NODE_ENV=production
EXPOSE 5000
WORKDIR /app/server
CMD ["node", "server.js"]
