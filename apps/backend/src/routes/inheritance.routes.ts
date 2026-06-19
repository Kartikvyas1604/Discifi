import { FastifyInstance } from 'fastify';
import { authenticateRequest, verifyDeviceSignature } from '../middleware/auth.middleware.js';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware.js';
import { inheritanceService } from '../services/inheritance.service.js';

export async function inheritanceRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/inheritance/status', {
    preHandler: [authenticateRequest],
    schema: {
      querystring: {
        type: 'object', required: ['wallet_pubkey'],
        properties: { wallet_pubkey: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const { wallet_pubkey } = request.query as any;
    return reply.send({ success: true, data: { wallet_pubkey, status: 'Active', claimed: false } });
  });

  app.post('/api/v1/inheritance/setup', {
    preHandler: [authenticateRequest, verifyDeviceSignature, idempotencyMiddleware],
    schema: {
      body: {
        type: 'object', required: ['owner_pubkey', 'beneficiary_pubkey'],
        properties: {
          owner_pubkey: { type: 'string' },
          beneficiary_pubkey: { type: 'string' },
          heartbeat_interval_seconds: { type: 'number' },
          grace_period_seconds: { type: 'number' },
        },
      },
    },
  }, async (request, reply) => {
    const body = request.body as any;
    return reply.send({
      success: true,
      data: {
        owner_pubkey: body.owner_pubkey,
        beneficiary_pubkey: body.beneficiary_pubkey,
        status: 'Active',
        created_at: Date.now(),
      },
    });
  });

  app.post('/api/v1/inheritance/heartbeat', {
    preHandler: [authenticateRequest, verifyDeviceSignature, idempotencyMiddleware],
    schema: {
      body: {
        type: 'object', required: ['wallet_pubkey'],
        properties: { wallet_pubkey: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const { wallet_pubkey } = request.body as any;
    await inheritanceService.sendHeartbeat(wallet_pubkey);
    return reply.send({ success: true, data: { wallet_pubkey, heartbeat_at: Date.now() } });
  });
}
