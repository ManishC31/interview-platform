import { Redis } from "ioredis";

// Create a singleton Redis connection that can be reused across hot reloads
// and by BullMQ queues/workers
const globalForRedis = globalThis as unknown as {
  __redis__: Redis | undefined;
};

function createRedisInstance(): Redis {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    return new Redis(redisUrl);
  }

  const host = process.env.REDIS_HOST || "127.0.0.1";
  const port = Number(process.env.REDIS_PORT || 6379);
  const password = process.env.REDIS_PASSWORD || undefined;

  return new Redis({ host, port, password, maxRetriesPerRequest: null });
}

export const redis: Redis = globalForRedis.__redis__ ?? createRedisInstance();
if (!globalForRedis.__redis__) {
  globalForRedis.__redis__ = redis;
}

export default redis;
