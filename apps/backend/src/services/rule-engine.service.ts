import type { RuleSet, RuleEvaluationResult, RuleEvent } from '@discifi/shared';
import { RULES_CACHE_TTL_SECONDS, REDIS_RULES_CACHE, DEFAULT_SLIPPAGE_MAX_BPS, DEFAULT_GAS_PRICE_CEILING } from '@discifi/shared';
import { getConfig } from '../config/env.js';
import { logger } from '../config/logger.js';
import { getRedisClient } from '../config/redis.js';
import { BlockchainError } from '../errors/index.js';

export interface EvaluateTransactionParams {
  walletPubkey: string;
  transactionAmount: number;
  gasPrice: number;
  slippage: number;
  currentHour: number;
}

export class RuleEngineService {
  async loadRuleSet(walletPubkey: string): Promise<RuleSet> {
    const redis = getRedisClient();
    const cacheKey = `${REDIS_RULES_CACHE}:${walletPubkey}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as RuleSet & { cached_at: number };
      return parsed as RuleSet;
    }

    const rules = await this.fetchRuleSetFromChain(walletPubkey);

    await redis.setex(cacheKey, RULES_CACHE_TTL_SECONDS, JSON.stringify({
      ...rules,
      cached_at: Date.now(),
    }));

    return rules;
  }

  async evaluateTransaction(walletPubkey: string, params: EvaluateTransactionParams): Promise<RuleEvaluationResult> {
    const ruleSet = await this.loadRuleSet(walletPubkey);
    const events: RuleEvent[] = [];
    const failedRules: string[] = [];

    if (!ruleSet.active) {
      return { passed: true, failed_rules: [], rule_events: [{ rule_name: 'rule_set_inactive', passed: true, details: 'Rule set is disabled — all transactions pass' }] };
    }

    const timeLockCheck = this.evaluateTimeLock(ruleSet, params.currentHour);
    events.push(timeLockCheck);
    if (!timeLockCheck.passed) failedRules.push(timeLockCheck.rule_name);

    const gasCheck = this.evaluateGasPrice(ruleSet, params.gasPrice);
    events.push(gasCheck);
    if (!gasCheck.passed) failedRules.push(gasCheck.rule_name);

    const slippageCheck = this.evaluateSlippage(ruleSet, params.slippage);
    events.push(slippageCheck);
    if (!slippageCheck.passed) failedRules.push(slippageCheck.rule_name);

    const spendingCheck = this.evaluateSpendingLimit(ruleSet, params.transactionAmount);
    events.push(spendingCheck);
    if (!spendingCheck.passed) failedRules.push(spendingCheck.rule_name);

    logger.info('Rule evaluation completed', {
      walletPubkey,
      passed: failedRules.length === 0,
      failedRules,
    });

    return {
      passed: failedRules.length === 0,
      failed_rules: failedRules,
      rule_events: events,
    };
  }

  async invalidateCache(walletPubkey: string): Promise<void> {
    const redis = getRedisClient();
    await redis.del(`${REDIS_RULES_CACHE}:${walletPubkey}`);
    logger.info('RuleSet cache invalidated', { walletPubkey });
  }

  private async fetchRuleSetFromChain(walletPubkey: string): Promise<RuleSet> {
    try {
      const config = getConfig();
      const response = await fetch(
        `https://api.helius.xyz/v0/account/${walletPubkey}?apiKey=${config.HELIUS_API_KEY}`,
      );
      if (!response.ok) throw new BlockchainError('Failed to fetch RuleSet from chain');
      const data = await response.json();

      const accountData = data?.account?.data || {};
      return {
        wallet_config: walletPubkey,
        gas_price_ceiling: accountData.gasPriceCeiling || DEFAULT_GAS_PRICE_CEILING,
        slippage_max_bps: accountData.slippageMaxBps || DEFAULT_SLIPPAGE_MAX_BPS,
        approval_expiry_seconds: accountData.approvalExpirySeconds || 7776000,
        new_contract_age_threshold_seconds: accountData.newContractAgeThreshold || 2592000,
        velocity_window_seconds: accountData.velocityWindowSeconds || 60,
        velocity_max_transactions: accountData.velocityMaxTransactions || 3,
        spending_dna_baseline_min: accountData.spendingDnaBaselineMin || 0,
        spending_dna_baseline_max: accountData.spendingDnaBaselineMax || 0,
        quarantine_window_seconds: accountData.quarantineWindowSeconds || 604800,
        quarantine_max_lamports: accountData.quarantineMaxLamports || 100000000,
        time_lock_start_hour: accountData.timeLockStartHour || 0,
        time_lock_end_hour: accountData.timeLockEndHour || 23,
        active: accountData.active !== false,
      };
    } catch (error) {
      logger.error('Failed to fetch RuleSet from chain', {
        walletPubkey,
        error: error instanceof Error ? error.message : String(error),
      });
      return this.getDefaultRuleSet(walletPubkey);
    }
  }

  private getDefaultRuleSet(walletPubkey: string): RuleSet {
    return {
      wallet_config: walletPubkey,
      gas_price_ceiling: DEFAULT_GAS_PRICE_CEILING,
      slippage_max_bps: DEFAULT_SLIPPAGE_MAX_BPS,
      approval_expiry_seconds: 7776000,
      new_contract_age_threshold_seconds: 2592000,
      velocity_window_seconds: 60,
      velocity_max_transactions: 3,
      spending_dna_baseline_min: 0,
      spending_dna_baseline_max: 0,
      quarantine_window_seconds: 604800,
      quarantine_max_lamports: 100000000,
      time_lock_start_hour: 0,
      time_lock_end_hour: 23,
      active: true,
    };
  }

  private evaluateTimeLock(ruleSet: RuleSet, currentHour: number): RuleEvent {
    if (currentHour < ruleSet.time_lock_start_hour || currentHour > ruleSet.time_lock_end_hour) {
      return {
        rule_name: 'time_lock',
        passed: false,
        details: `Hour ${currentHour} is outside allowed window (${ruleSet.time_lock_start_hour}-${ruleSet.time_lock_end_hour} UTC)`,
      };
    }
    return {
      rule_name: 'time_lock',
      passed: true,
      details: `Hour ${currentHour} is within allowed window`,
    };
  }

  private evaluateGasPrice(ruleSet: RuleSet, gasPrice: number): RuleEvent {
    if (gasPrice > ruleSet.gas_price_ceiling) {
      return {
        rule_name: 'gas_price',
        passed: false,
        details: `Gas price ${gasPrice} exceeds ceiling ${ruleSet.gas_price_ceiling}`,
      };
    }
    return { rule_name: 'gas_price', passed: true, details: `Gas price ${gasPrice} within limit` };
  }

  private evaluateSlippage(ruleSet: RuleSet, slippage: number): RuleEvent {
    if (slippage > ruleSet.slippage_max_bps) {
      return {
        rule_name: 'slippage',
        passed: false,
        details: `Slippage ${slippage} bps exceeds max ${ruleSet.slippage_max_bps} bps`,
      };
    }
    return { rule_name: 'slippage', passed: true, details: `Slippage ${slippage} bps within limit` };
  }

  private evaluateSpendingLimit(ruleSet: RuleSet, amount: number): RuleEvent {
    if (ruleSet.spending_dna_baseline_max > 0 && amount > ruleSet.spending_dna_baseline_max) {
      return {
        rule_name: 'spending_limit',
        passed: false,
        details: `Amount ${amount} exceeds spending baseline max ${ruleSet.spending_dna_baseline_max}`,
      };
    }
    return { rule_name: 'spending_limit', passed: true, details: `Amount ${amount} within spending baseline` };
  }
}

export const ruleEngineService = new RuleEngineService();
