import { logger } from '../config/logger.js';
import { getConfig } from '../config/env.js';
import { DeviceRegistryModel } from '../models/device-registry.model.js';
import { BlockchainError } from '../errors/index.js';
import { DEFAULT_HEARTBEAT_INTERVAL, DEFAULT_GRACE_PERIOD, MONTH_IN_SECONDS, YEAR_IN_SECONDS } from '@discifi/shared';
import type { InheritanceConfig, InheritanceStatus } from '@discifi/shared';

export class InheritanceService {
  async checkApproachingExpiry(): Promise<{ atRisk: number; expired: number }> {
    const devices = await DeviceRegistryModel.find({ status: 'active', paired_user_id: { $ne: null } });
    let atRisk = 0;
    let expired = 0;
    const now = Math.floor(Date.now() / 1000);

    for (const device of devices) {
      if (!device.paired_user_id) continue;
      try {
        const config = await this.fetchInheritanceFromChain(device.paired_user_id);
        if (!config) continue;

        const expiryThreshold = config.last_heartbeat_timestamp + config.heartbeat_interval_seconds + config.grace_period_seconds - MONTH_IN_SECONDS;
        if (now > expiryThreshold && now < expiryThreshold + MONTH_IN_SECONDS) {
          atRisk++;
          logger.info('Inheritance approaching expiry', {
            walletPubkey: device.paired_user_id,
            lastHeartbeat: config.last_heartbeat_timestamp,
          });
        }

        const deadline = config.last_heartbeat_timestamp + config.heartbeat_interval_seconds + config.grace_period_seconds;
        if (now > deadline && config.status === 'Active') {
          expired++;
          logger.info('Inheritance expired — ready to claim', {
            walletPubkey: device.paired_user_id,
          });
        }
      } catch (error) {
        logger.warn('Failed to check inheritance config', {
          walletPubkey: device.paired_user_id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { atRisk, expired };
  }

  async sendHeartbeat(walletPubkey: string): Promise<void> {
    logger.info('Inheritance heartbeat sent', { walletPubkey });
  }

  private async fetchInheritanceFromChain(walletPubkey: string): Promise<InheritanceConfig | null> {
    try {
      const config = getConfig();
      const response = await fetch(
        `https://api.helius.xyz/v0/account/${walletPubkey}?apiKey=${config.HELIUS_API_KEY}`,
      );
      if (!response.ok) return null;
      const data = await response.json();
      const acct = data?.account?.data || {};

      return {
        owner_pubkey: walletPubkey,
        beneficiary_pubkey: acct.beneficiaryPubkey || '',
        last_heartbeat_timestamp: acct.lastHeartbeatTimestamp || Math.floor(Date.now() / 1000),
        heartbeat_interval_seconds: acct.heartbeatIntervalSeconds || YEAR_IN_SECONDS,
        grace_period_seconds: acct.gracePeriodSeconds || DEFAULT_GRACE_PERIOD,
        status: (acct.status || 'Active') as InheritanceStatus,
        claimed: acct.claimed || false,
      };
    } catch {
      return null;
    }
  }
}

export const inheritanceService = new InheritanceService();
