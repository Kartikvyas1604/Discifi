import { FastifyInstance } from 'fastify';
import { authenticateRequest, verifyDeviceSignature } from '../middleware/auth.middleware.js';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware.js';
import { simulationService } from '../services/simulation.service.js';
import { drainDetectionService } from '../services/drain-detection.service.js';
import { ruleEngineService } from '../services/rule-engine.service.js';
import { DrainDetectedError, RuleViolationError } from '../errors/index.js';
import type { SigningDecision } from '@discifi/shared';

export async function transactionRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/v1/transaction/simulate', {
    preHandler: [authenticateRequest, verifyDeviceSignature, idempotencyMiddleware],
    schema: {
      body: {
        type: 'object', required: ['transaction_base64', 'expected_outcome'],
        properties: {
          transaction_base64: { type: 'string' },
          expected_outcome: { type: 'string' },
          approved_programs: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  }, async (request, reply) => {
    const { transaction_base64, expected_outcome, approved_programs } = request.body as any;
    const result = await simulationService.simulateTransaction(transaction_base64, expected_outcome, approved_programs || []);
    return reply.send({ success: true, data: result });
  });

  app.post('/api/v1/transaction/analyze', {
    preHandler: [authenticateRequest, verifyDeviceSignature],
    schema: {
      body: {
        type: 'object', required: ['transaction_base64', 'wallet_pubkey', 'instruction_data'],
        properties: {
          transaction_base64: { type: 'string' },
          wallet_pubkey: { type: 'string' },
          instruction_data: { type: 'object' },
          dapp_origin: { type: 'string' },
          destination_address: { type: 'string' },
          expected_outcome: { type: 'string' },
          approved_programs: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  }, async (request, reply) => {
    const body = request.body as any;
    const result = await drainDetectionService.analyzeTransaction({
      transactionBase64: body.transaction_base64,
      walletPubkey: body.wallet_pubkey,
      instructionData: body.instruction_data,
      dappOrigin: body.dapp_origin,
      destinationAddress: body.destination_address,
      expectedOutcome: body.expected_outcome || '',
      approvedPrograms: body.approved_programs || [],
    });
    return reply.send({ success: true, data: result });
  });

  app.post('/api/v1/transaction/sign-request', {
    preHandler: [authenticateRequest, verifyDeviceSignature, idempotencyMiddleware],
    schema: {
      body: {
        type: 'object', required: ['transaction_base64', 'wallet_pubkey', 'instruction_data'],
        properties: {
          transaction_base64: { type: 'string' },
          wallet_pubkey: { type: 'string' },
          instruction_data: { type: 'object' },
          expected_outcome: { type: 'string' },
          gas_price: { type: 'number' },
          slippage: { type: 'number' },
          dapp_origin: { type: 'string' },
          destination_address: { type: 'string' },
          approved_programs: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  }, async (request, reply) => {
    const body = request.body as any;

    const simulation = await simulationService.simulateTransaction(
      body.transaction_base64,
      body.expected_outcome || '',
      body.approved_programs || [],
    );

    const drainAnalysis = await drainDetectionService.analyzeTransaction({
      transactionBase64: body.transaction_base64,
      walletPubkey: body.wallet_pubkey,
      instructionData: body.instruction_data,
      dappOrigin: body.dapp_origin,
      destinationAddress: body.destination_address,
      expectedOutcome: body.expected_outcome || '',
      approvedPrograms: body.approved_programs || [],
    });

    const currentHour = new Date().getUTCHours();
    const ruleEvaluation = await ruleEngineService.evaluateTransaction(body.wallet_pubkey, {
      walletPubkey: body.wallet_pubkey,
      transactionAmount: parseInt(body.instruction_data?.amount || '0', 10),
      gasPrice: body.gas_price || 0,
      slippage: body.slippage || 0,
      currentHour,
    });

    let status: SigningDecision['status'] = 'approved';
    let blockReason: string | null = null;

    if (drainAnalysis.recommendation === 'block') {
      status = 'blocked';
      blockReason = drainAnalysis.block_reason || 'Drain detection blocked transaction';
    } else if (!ruleEvaluation.passed) {
      status = 'blocked';
      blockReason = `Rule violations: ${ruleEvaluation.failed_rules.join(', ')}`;
    } else if (drainAnalysis.recommendation === 'require_override') {
      status = 'requires_override';
    } else if (drainAnalysis.recommendation === 'warn_user') {
      status = 'requires_override';
    }

    const decision: SigningDecision = {
      status,
      simulation,
      drain_analysis: drainAnalysis,
      rule_evaluation: ruleEvaluation,
      signed_transaction: status === 'approved' ? body.transaction_base64 : null,
      block_reason: blockReason,
    };

    if (status === 'blocked') {
      throw new DrainDetectedError(
        blockReason || 'Transaction blocked',
        drainAnalysis,
        { walletPubkey: body.wallet_pubkey },
        blockReason || 'Transaction blocked by security checks',
      );
    }

    return reply.send({ success: true, data: decision });
  });
}
