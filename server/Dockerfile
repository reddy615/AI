FROM node:20-slim

WORKDIR /app

COPY package*.json ./
ENV NODE_ENV=production
RUN npm ci --omit=dev --no-audit --no-fund

COPY . .

EXPOSE 5000

CMD ["npm", "start"]