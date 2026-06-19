import Redis from 'ioredis';
import { getConfig } from './env.js';
import { logger } from './logger.js';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (redisClient?.status === 'ready') return redisClient;
  const { REDIS_URL } = getConfig();
  redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 5) return null;
      return Math.min(times * 200, 2000);
    },
    enableOfflineQueue: true,
  });
  redisClient.on('connect', () => logger.info('Redis connected'));
  redisClient.on('error', (err) => logger.error('Redis error', { error: err.message }));
  redisClient.on('close', () => logger.warn('Redis connection closed'));
  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected gracefully');
  }
}

export function getRedisStatus() {
  return { connected: redisClient?.status === 'ready', status: redisClient?.status ?? 'not_connected' };
}
