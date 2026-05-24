const Redis = require('ioredis');

let client = null;

function getRedisClient() {
  if (!process.env.REDIS_URL) return null;
  if (client) return client;

  client = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
  });

  client.on('error', (error) => {
    console.warn('[redis] connection error:', error.message);
  });

  return client;
}

async function connectRedis() {
  const redis = getRedisClient();
  if (!redis) return null;
  if (redis.status === 'wait' || redis.status === 'end') {
    await redis.connect();
  }
  return redis;
}

module.exports = { getRedisClient, connectRedis };
