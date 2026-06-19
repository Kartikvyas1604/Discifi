import { getConfig } from '../config/env.js';
import { logger } from '../config/logger.js';
import { SimulationCacheModel } from '../models/simulation-cache.model.js';
import { SimulationError } from '../errors/index.js';
import type { SimulationResult, TokenChange } from '@discifi/shared';

export class SimulationService {
  private heliusSimEndpoint: string;
  private quicknodeEndpoint: string;
  private heliusApiKey: string;

  constructor() {
    const config = getConfig();
    this.heliusApiKey = config.HELIUS_API_KEY;
    this.heliusSimEndpoint = `https://api.helius.xyz/v0/transaction/simulate?apiKey=${this.heliusApiKey}`;
    this.quicknodeEndpoint = config.QUICKNODE_ENDPOINT;
  }

  async simulateTransaction(
    transactionBase64: string,
    expectedOutcome: string,
    approvedPrograms: string[] = [],
  ): Promise<SimulationResult> {
    const cacheKey = this.hashTransaction(transactionBase64);
    const cached = await SimulationCacheModel.findOne({ transaction_hash: cacheKey });
    if (cached) {
      return {
        simulation_passed: !cached.mismatch_detected,
        expected_outcome: cached.expected_outcome,
        actual_outcome: cached.actual_outcome,
        mismatch_detected: cached.mismatch_detected,
        mismatch_details: cached.mismatch_detected ? 'Cached mismatch detected' : null,
        token_changes: [],
        sol_change: 0,
        programs_invoked: [],
        new_programs_invoked: [],
        estimated_fee: 0,
      };
    }

    let simResponse;
    try {
      simResponse = await this.callHeliusSimulation(transactionBase64);
    } catch (heliusError) {
      logger.warn('Helius simulation failed, falling back to QuickNode', {
        error: heliusError instanceof Error ? heliusError.message : String(heliusError),
      });
      try {
        simResponse = await this.callQuickNodeSimulation(transactionBase64);
      } catch (quicknodeError) {
        logger.error('Both simulation providers failed', {
          helius: heliusError instanceof Error ? heliusError.message : String(heliusError),
          quicknode: quicknodeError instanceof Error ? quicknodeError.message : String(quicknodeError),
        });
        return {
          simulation_passed: false,
          expected_outcome: expectedOutcome,
          actual_outcome: 'simulation_unavailable',
          mismatch_detected: false,
          mismatch_details: 'Simulation unavailable — both RPC providers failed. Proceed with caution.',
          token_changes: [],
          sol_change: 0,
          programs_invoked: [],
          new_programs_invoked: [],
          estimated_fee: 0,
        };
      }
    }

    const parsed = this.parseSimulationResponse(simResponse, expectedOutcome, approvedPrograms);

    await this.cacheResult(cacheKey, parsed);
    return parsed;
  }

  private async callHeliusSimulation(tx: string): Promise<any> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(this.heliusSimEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: tx, encoding: 'base64' }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new SimulationError(`Helius simulation returned ${response.status}`, { status: response.status });
      }

      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  private async callQuickNodeSimulation(tx: string): Promise<any> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(this.quicknodeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'simulateTransaction',
          params: [tx, { encoding: 'base64', replaceRecentBlockhash: true }],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new SimulationError(`QuickNode simulation returned ${response.status}`, { status: response.status });
      }

      const json = await response.json();
      return json.result || json;
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseSimulationResponse(response: any, expectedOutcome: string, approvedPrograms: string[]): SimulationResult {
    const accounts = response?.value?.accounts || response?.accounts || [];
    const logs = response?.value?.logs || response?.logs || [];
    const tokenChanges: TokenChange[] = [];
    const programsInvoked = new Set<string>();
    const newProgramsInvoked: string[] = [];

    for (const log of logs) {
      const programMatch = log.match(/Program\s+(\w+)\s+invoke/);
      if (programMatch && programMatch[1]) {
        programsInvoked.add(programMatch[1]);
        if (!approvedPrograms.includes(programMatch[1])) {
          newProgramsInvoked.push(programMatch[1]);
        }
      }
      const tokenMatch = log.match(/Transfer\s+(\d+)\s+(\w+)/);
      if (tokenMatch) {
        tokenChanges.push({
          mint: tokenMatch[2] || 'unknown',
          amount: parseInt(tokenMatch[1] || '0', 10),
          direction: log.includes('to') ? 'out' : 'in',
        });
      }
    }

    const estimatedFee = response?.value?.fee || 0;
    const actualOutcome = logs.join('; ').substring(0, 500);
    const mismatchDetected = !actualOutcome.includes(expectedOutcome.substring(0, 50));

    return {
      simulation_passed: !mismatchDetected,
      expected_outcome: expectedOutcome,
      actual_outcome: actualOutcome || 'No simulation logs returned',
      mismatch_detected: mismatchDetected,
      mismatch_details: mismatchDetected ? 'Simulated outcome differs from expected outcome' : null,
      token_changes: tokenChanges,
      sol_change: response?.value?.lamportsChange || 0,
      programs_invoked: Array.from(programsInvoked),
      new_programs_invoked: newProgramsInvoked,
      estimated_fee: estimatedFee,
    };
  }

  private async cacheResult(hash: string, result: SimulationResult): Promise<void> {
    try {
      await SimulationCacheModel.findOneAndUpdate(
        { transaction_hash: hash },
        {
          transaction_hash: hash,
          simulation_result: result as unknown as Record<string, unknown>,
          expected_outcome: result.expected_outcome,
          actual_outcome: result.actual_outcome,
          mismatch_detected: result.mismatch_detected,
          simulated_at: new Date(),
          chain_id: 'solana-mainnet',
        },
        { upsert: true, new: true },
      );
    } catch (error) {
      logger.warn('Failed to cache simulation result', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private hashTransaction(tx: string): string {
    const nacl = require('tweetnacl');
    const naclUtil = require('tweetnacl-util');
    const hash = nacl.hash(naclUtil.decodeUTF8(tx));
    return naclUtil.encodeBase64(hash);
  }
}

export const simulationService = new SimulationService();
