import { FastifyInstance } from 'fastify';
import { authenticateRequest, verifyDeviceSignature } from '../middleware/auth.middleware.js';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware.js';
import { privacyRoutingService } from '../services/privacy-routing.service.js';

export async function privacyRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/v1/privacy/shield', {
    preHandler: [authenticateRequest, verifyDeviceSignature, idempotencyMiddleware],
    schema: {
      body: {
        type: 'object', required: ['wallet_pubkey', 'amount', 'token_mint'],
        properties: {
          wallet_pubkey: { type: 'string' },
          amount: { type: 'number' },
          token_mint: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const result = await privacyRoutingService.shield(request.body as any);
    return reply.send({ success: true, data: result });
  });

  app.post('/api/v1/privacy/transfer', {
    preHandler: [authenticateRequest, verifyDeviceSignature, idempotencyMiddleware],
    schema: {
      body: {
        type: 'object', required: ['shield_commitment', 'recipient_stealth_address', 'amount'],
        properties: {
          shield_commitment: { type: 'string' },
          recipient_stealth_address: { type: 'string' },
          amount: { type: 'number' },
        },
      },
    },
  }, async (request, reply) => {
    const result = await privacyRoutingService.privateTransfer(request.body as any);
    return reply.send({ success: true, data: result });
  });

  app.post('/api/v1/privacy/unshield', {
    preHandler: [authenticateRequest, verifyDeviceSignature, idempotencyMiddleware],
    schema: {
      body: {
        type: 'object', required: ['shield_commitment', 'destination_pubkey'],
        properties: {
          shield_commitment: { type: 'string' },
          destination_pubkey: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const result = await privacyRoutingService.unshield(request.body as any);
    return reply.send({ success: true, data: result });
  });

  app.get('/api/v1/privacy/stealth-transfers', {
    preHandler: [authenticateRequest],
    schema: {
      querystring: {
        type: 'object', required: ['wallet_pubkey'],
        properties: { wallet_pubkey: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const { wallet_pubkey } = request.query as any;
    return reply.send({ success: true, data: { wallet_pubkey, transfers: [], total: 0 } });
  });
}
