import { FastifyInstance } from 'fastify';
import { authenticateRequest, verifyDeviceSignature } from '../middleware/auth.middleware.js';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware.js';

export async function multisigRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/v1/multisig/create-session', {
    preHandler: [authenticateRequest, verifyDeviceSignature, idempotencyMiddleware],
    schema: {
      body: {
        type: 'object', required: ['initiator_pubkey', 'co_signer_pubkey', 'transaction_hash'],
        properties: {
          initiator_pubkey: { type: 'string' },
          co_signer_pubkey: { type: 'string' },
          transaction_hash: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const body = request.body as any;
    return reply.send({
      success: true,
      data: {
        session_id: `ms_${Date.now()}`,
        initiator_pubkey: body.initiator_pubkey,
        co_signer_pubkey: body.co_signer_pubkey,
        created_at: Date.now(),
        expiry_at: Date.now() + 600000,
        status: 'awaiting_co_sign',
      },
    });
  });

  app.post('/api/v1/multisig/co-sign', {
    preHandler: [authenticateRequest, verifyDeviceSignature, idempotencyMiddleware],
    schema: {
      body: {
        type: 'object', required: ['session_id'],
        properties: { session_id: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const { session_id } = request.body as any;
    return reply.send({
      success: true,
      data: { session_id, status: 'fully_signed', co_signed_at: Date.now() },
    });
  });

  app.post('/api/v1/multisig/execute', {
    preHandler: [authenticateRequest, verifyDeviceSignature, idempotencyMiddleware],
    schema: {
      body: {
        type: 'object', required: ['session_id'],
        properties: { session_id: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const { session_id } = request.body as any;
    return reply.send({
      success: true,
      data: { session_id, executed: true, transaction_signature: `sig_${session_id}`, executed_at: Date.now() },
    });
  });
}
