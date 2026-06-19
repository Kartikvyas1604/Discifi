import { FastifyInstance } from 'fastify';
import { getDatabaseStatus } from '../config/database.js';
import { getRedisStatus } from '../config/redis.js';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async (_request, reply) => {
    const dbStatus = getDatabaseStatus();
    const redisStatus = getRedisStatus();

    const healthy = dbStatus.connected && redisStatus.connected;

    const statusCode = healthy ? 200 : 503;
    return reply.status(statusCode).send({
      status: healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        mongodb: dbStatus,
        redis: redisStatus,
      },
    });
  });
}
