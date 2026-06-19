import { FastifyInstance } from 'fastify';
import { authenticateRequest } from '../middleware/auth.middleware.js';
import { spendingDnaService } from '../services/spending-dna.service.js';
import { getConfig } from '../config/env.js';

export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/analytics/spending-dna', {
    preHandler: [authenticateRequest],
    schema: {
      querystring: {
        type: 'object', required: ['wallet_pubkey'],
        properties: { wallet_pubkey: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const { wallet_pubkey } = request.query as any;
    const dna = await spendingDnaService.getBaseline(wallet_pubkey);
    return reply.send({ success: true, data: dna || { message: 'No spending DNA computed yet' } });
  });

  app.get('/api/v1/analytics/portfolio', {
    preHandler: [authenticateRequest],
    schema: {
      querystring: {
        type: 'object', required: ['wallet_pubkey'],
        properties: { wallet_pubkey: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const { wallet_pubkey } = request.query as any;
    const config = getConfig();
    const response = await fetch(
      `https://api.helius.xyz/v0/addresses/${wallet_pubkey}/balances?apiKey=${config.HELIUS_API_KEY}`,
    );
    const balances = await response.json();
    return reply.send({ success: true, data: balances });
  });

  app.get('/api/v1/analytics/transaction-history', {
    preHandler: [authenticateRequest],
    schema: {
      querystring: {
        type: 'object', required: ['wallet_pubkey'],
        properties: {
          wallet_pubkey: { type: 'string' },
          limit: { type: 'number', default: 50 },
          before: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { wallet_pubkey, limit, before } = request.query as any;
    const config = getConfig();
    let url = `https://api.helius.xyz/v0/addresses/${wallet_pubkey}/transactions?apiKey=${config.HELIUS_API_KEY}&limit=${limit || 50}`;
    if (before) url += `&before=${before}`;
    const response = await fetch(url);
    const transactions = await response.json();
    return reply.send({ success: true, data: transactions });
  });

  app.get('/api/v1/analytics/risk-score', {
    preHandler: [authenticateRequest],
    schema: {
      querystring: {
        type: 'object', required: ['wallet_pubkey'],
        properties: { wallet_pubkey: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const { wallet_pubkey } = request.query as any;
    const dna = await spendingDnaService.getBaseline(wallet_pubkey);
    const anomalyCount = dna?.anomaly_history?.filter(a => !a.resolved).length || 0;
    const score = Math.max(0, 100 - (anomalyCount * 10));
    return reply.send({
      success: true,
      data: {
        overall_score: score,
        approval_health_score: 100,
        anomaly_count: anomalyCount,
        rules_active: true,
        vault_mode: false,
        hodl_lock_active: false,
        recommendation: score > 80 ? 'Wallet health is good' : 'Review recent anomalies',
      },
    });
  });
}
