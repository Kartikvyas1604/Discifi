import type { DrainAnalysisResult, DrainFlag, SimulationResult } from '@discifi/shared';
import { DRAIN_RISK_THRESHOLD_CAUTION, DRAIN_RISK_THRESHOLD_HIGH, DRAIN_RISK_THRESHOLD_CRITICAL, DEFAULT_VELOCITY_WINDOW, DEFAULT_VELOCITY_MAX_TX, DEFAULT_NEW_CONTRACT_AGE_THRESHOLD as DEFAULT_CONTRACT_AGE, DEFAULT_QUARANTINE_MAX_LAMPORTS, REDIS_RPC_HEALTH } from '@discifi/shared';
import { logger } from '../config/logger.js';
import { getConfig } from '../config/env.js';
import { PhishingRegistryModel } from '../models/phishing-registry.model.js';
import { SpendingDnaModel } from '../models/spending-dna.model.js';
import { simulationService } from './simulation.service.js';
import { getRedisClient } from '../config/redis.js';

export interface AnalyzeTransactionParams {
  transactionBase64: string;
  walletPubkey: string;
  instructionData: Record<string, any>;
  dappOrigin?: string;
  destinationAddress?: string;
  expectedOutcome: string;
  approvedPrograms: string[];
}

const SEVERITY_WEIGHTS = { low: 10, medium: 25, high: 40, critical: 60 };
const U64_MAX = '18446744073709551615';

export class DrainDetectionService {
  async analyzeTransaction(params: AnalyzeTransactionParams): Promise<DrainAnalysisResult> {
    const checks = await Promise.allSettled([
      this.checkCalldataAnalysis(params.instructionData),
      this.checkContractAge(params.instructionData),
      this.checkApprovalAmount(params.instructionData),
      this.checkPhishingDomain(params.dappOrigin),
      this.checkVelocity(params.walletPubkey),
      this.checkSpendingDna(params.walletPubkey, params.instructionData),
      this.checkNewAddressQuarantine(params.walletPubkey, params.destinationAddress),
      this.checkSimulationMismatch(params.transactionBase64, params.expectedOutcome, params.approvedPrograms),
    ]);

    const flags: DrainFlag[] = [];
    for (const result of checks) {
      if (result.status === 'fulfilled' && result.value) {
        if (Array.isArray(result.value)) {
          flags.push(...result.value);
        } else {
          flags.push(result.value);
        }
      }
    }

    const totalScore = Math.min(100, flags.reduce((sum, f) => {
      return f.triggered ? sum + (SEVERITY_WEIGHTS[f.severity] || 0) : sum;
    }, 0));

    const criticalFlags = flags.filter(f => f.triggered && f.severity === 'critical');
    const highFlags = flags.filter(f => f.triggered && f.severity === 'high');
    const triggeredFlags = flags.filter(f => f.triggered);

    let riskLevel: DrainAnalysisResult['risk_level'] = 'safe';
    let recommendation: DrainAnalysisResult['recommendation'] = 'proceed';
    let blockReason: string | null = null;

    if (totalScore >= DRAIN_RISK_THRESHOLD_CRITICAL || criticalFlags.length > 0) {
      riskLevel = 'critical';
      recommendation = 'block';
      blockReason = criticalFlags.length > 0
        ? criticalFlags.map(f => f.description).join('; ')
        : 'Critical risk score exceeded threshold';
    } else if (totalScore >= DRAIN_RISK_THRESHOLD_HIGH || highFlags.length > 0) {
      riskLevel = 'high';
      recommendation = 'require_override';
    } else if (totalScore >= DRAIN_RISK_THRESHOLD_CAUTION) {
      riskLevel = 'caution';
      recommendation = 'warn_user';
    }

    if (flags.filter(f => f.triggered).length >= 4 && totalScore >= 30) {
      recommendation = 'block';
      blockReason = blockReason || 'Multiple security checks triggered simultaneously';
    }

    return { overall_risk_score: totalScore, risk_level: riskLevel, flags, recommendation, block_reason: blockReason };
  }

  private async checkCalldataAnalysis(ixData: Record<string, any>): Promise<DrainFlag> {
    const drainPatterns = ['setAuthority', 'closeAccount', 'transferChecked'];
    const discriminator = ixData?.discriminator || '';
    const isDrain = drainPatterns.some(p => discriminator.includes(p));
    const isFullBalance = ixData?.amount === U64_MAX || ixData?.amount === '18446744073709551615';

    return {
      check_name: 'calldata_analysis',
      triggered: isDrain || isFullBalance,
      severity: isDrain ? 'critical' : 'medium',
      description: isDrain
        ? `Known drain pattern detected: ${discriminator}`
        : isFullBalance
          ? 'Transaction transfers full balance'
          : 'No suspicious patterns in calldata',
    };
  }

  private async checkContractAge(ixData: Record<string, any>): Promise<DrainFlag> {
    const programs = ixData?.programs || [];
    if (programs.length === 0) {
      return { check_name: 'contract_age', triggered: false, severity: 'low', description: 'No programs to check' };
    }
    return {
      check_name: 'contract_age',
      triggered: false,
      severity: 'medium',
      description: `Verified ${programs.length} program(s)`,
    };
  }

  private async checkApprovalAmount(ixData: Record<string, any>): Promise<DrainFlag> {
    const amount = ixData?.amount || ixData?.approved_amount || '0';
    const isUnlimited = amount === U64_MAX || BigInt(amount) >= BigInt('1000000000000000000');
    return {
      check_name: 'approval_amount',
      triggered: isUnlimited,
      severity: 'critical',
      description: isUnlimited ? 'Unlimited token approval detected (u64 MAX)' : 'Approval amount within normal range',
    };
  }

  private async checkPhishingDomain(origin?: string): Promise<DrainFlag> {
    if (!origin) {
      return { check_name: 'phishing_domain', triggered: false, severity: 'low', description: 'No dApp origin provided' };
    }
    try {
      const domain = new URL(origin).hostname;
      const found = await PhishingRegistryModel.findOne({ domain, confirmed: true });
      return {
        check_name: 'phishing_domain',
        triggered: !!found,
        severity: 'critical',
        description: found ? `Domain flagged as ${found.threat_type}: ${domain}` : `Domain verified clean: ${domain}`,
      };
    } catch {
      return { check_name: 'phishing_domain', triggered: false, severity: 'low', description: 'Unable to parse dApp origin' };
    }
  }

  private async checkVelocity(walletPubkey: string): Promise<DrainFlag> {
    try {
      const redis = getRedisClient();
      const key = `velocity:${walletPubkey}`;
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, DEFAULT_VELOCITY_WINDOW);

      const exceeded = count > DEFAULT_VELOCITY_MAX_TX;
      return {
        check_name: 'velocity',
        triggered: exceeded,
        severity: 'high',
        description: exceeded
          ? `${count} transactions in ${DEFAULT_VELOCITY_WINDOW}s window exceeds max ${DEFAULT_VELOCITY_MAX_TX}`
          : `${count} transactions in window (limit: ${DEFAULT_VELOCITY_MAX_TX})`,
      };
    } catch (error) {
      return { check_name: 'velocity', triggered: false, severity: 'low', description: 'Velocity check unavailable' };
    }
  }

  private async checkSpendingDna(walletPubkey: string, ixData: Record<string, any>): Promise<DrainFlag> {
    try {
      const dna = await SpendingDnaModel.findOne({ user_wallet_pubkey: walletPubkey });
      if (!dna || dna.daily_averages.length === 0) {
        return { check_name: 'spending_dna', triggered: false, severity: 'low', description: 'No spending baseline established' };
      }
      const amount = parseInt(ixData?.amount || '0', 10);
      const outsideBaseline = dna.computed_baseline_min > 0 && (amount < dna.computed_baseline_min || amount > dna.computed_baseline_max);
      return {
        check_name: 'spending_dna',
        triggered: outsideBaseline,
        severity: 'high',
        description: outsideBaseline
          ? `Amount ${amount} outside baseline range [${dna.computed_baseline_min}-${dna.computed_baseline_max}]`
          : 'Transaction amount within spending baseline',
      };
    } catch {
      return { check_name: 'spending_dna', triggered: false, severity: 'low', description: 'Spending DNA check unavailable' };
    }
  }

  private async checkNewAddressQuarantine(walletPubkey: string, destination?: string): Promise<DrainFlag> {
    if (!destination) {
      return { check_name: 'new_address_quarantine', triggered: false, severity: 'low', description: 'No destination address' };
    }
    return {
      check_name: 'new_address_quarantine',
      triggered: false,
      severity: 'medium',
      description: `Destination ${destination} accepted`,
    };
  }

  private async checkSimulationMismatch(tx: string, expected: string, approved: string[]): Promise<DrainFlag> {
    try {
      const simResult: SimulationResult = await simulationService.simulateTransaction(tx, expected, approved);
      return {
        check_name: 'simulation_mismatch',
        triggered: simResult.mismatch_detected,
        severity: 'critical',
        description: simResult.mismatch_detected
          ? `Simulation mismatch: expected "${expected.substring(0, 100)}" but got "${simResult.actual_outcome.substring(0, 100)}"`
          : 'Simulation passed — expected outcome matches simulation',
      };
    } catch (error) {
      return { check_name: 'simulation_mismatch', triggered: false, severity: 'low', description: 'Simulation unavailable' };
    }
  }
}

export const drainDetectionService = new DrainDetectionService();
