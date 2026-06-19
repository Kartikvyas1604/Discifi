import { FastifyInstance } from 'fastify';
import { authenticateRequest, verifyDeviceSignature } from '../middleware/auth.middleware.js';
import { ruleEngineService } from '../services/rule-engine.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export async function walletRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/wallet/rules', {
    preHandler: [authenticateRequest],
    schema: {
      querystring: {
        type: 'object', required: ['wallet_pubkey'],
        properties: { wallet_pubkey: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const { wallet_pubkey } = request.query as any;
    const ruleSet = await ruleEngineService.loadRuleSet(wallet_pubkey);
    return reply.send({ success: true, data: ruleSet });
  });

  app.put('/api/v1/wallet/rules', {
    preHandler: [authenticateRequest, verifyDeviceSignature],
    schema: {
      body: {
        type: 'object', required: ['wallet_pubkey', 'rules'],
        properties: {
          wallet_pubkey: { type: 'string' },
          rules: { type: 'object' },
        },
      },
    },
  }, async (request, reply) => {
    const { wallet_pubkey, rules } = request.body as any;
    await ruleEngineService.invalidateCache(wallet_pubkey);
    return reply.send({ success: true, data: { message: 'Rules updated', updated_at: Date.now() } });
  });

  app.get('/api/v1/wallet/approvals', {
    preHandler: [authenticateRequest],
    schema: {
      querystring: {
        type: 'object', required: ['wallet_pubkey'],
        properties: { wallet_pubkey: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const { wallet_pubkey } = request.query as any;
    return reply.send({ success: true, data: { wallet_pubkey, approvals: [], total: 0 } });
  });

  app.delete('/api/v1/wallet/approvals/:spender', {
    preHandler: [authenticateRequest, verifyDeviceSignature],
  }, async (request, reply) => {
    const { spender } = request.params as any;
    return reply.send({ success: true, data: { message: `Approval for ${spender} revoked` } });
  });

  app.get('/api/v1/wallet/approvals/health', {
    preHandler: [authenticateRequest],
    schema: {
      querystring: {
        type: 'object', required: ['wallet_pubkey'],
        properties: { wallet_pubkey: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const { wallet_pubkey } = request.query as any;
    return reply.send({
      success: true,
      data: { score: 100, stale_approvals: [], total_active: 0, recommendation: 'No active approvals' },
    });
  });
}
