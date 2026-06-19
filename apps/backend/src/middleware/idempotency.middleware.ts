import { FastifyRequest, FastifyReply } from 'fastify';
import { getRedisClient } from '../config/redis.js';
import { REDIS_IDEMPOTENCY, IDEMPOTENCY_TTL_SECONDS } from '@discifi/shared';

export async function idempotencyMiddleware(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (req.method !== 'POST') return;
  const idempotencyKey = req.headers['x-idempotency-key'] as string;
  if (!idempotencyKey) return;

  const redis = getRedisClient();
  const cacheKey = `${REDIS_IDEMPOTENCY}:${idempotencyKey}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    reply.status(200).send(JSON.parse(cached));
    return;
  }
  const originalSend = reply.send.bind(reply);
  reply.send = function (payload: unknown) {
    redis.setex(cacheKey, IDEMPOTENCY_TTL_SECONDS, JSON.stringify(payload)).catch(() => {});
    return originalSend(payload);
  } as typeof reply.send;
}
