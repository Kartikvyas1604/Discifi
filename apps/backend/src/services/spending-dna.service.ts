import { logger } from '../config/logger.js';
import { getConfig } from '../config/env.js';
import { SpendingDnaModel } from '../models/spending-dna.model.js';
import { DeviceRegistryModel } from '../models/device-registry.model.js';
import type { DailyTransactionSummary, DetectedAnomaly } from '@discifi/shared';

export class SpendingDnaService {
  async computeForUser(walletPubkey: string): Promise<void> {
    try {
      const config = getConfig();
      const response = await fetch(
        `https://api.helius.xyz/v0/addresses/${walletPubkey}/transactions?apiKey=${config.HELIUS_API_KEY}&limit=100`,
      );
      if (!response.ok) {
        logger.warn('Failed to fetch transaction history', { walletPubkey, status: response.status });
        return;
      }

      const transactions = await response.json();
      const dailyAverages = this.aggregateByDay(transactions);
      const amounts = dailyAverages.map(d => d.avg_transaction_lamports).filter(a => a > 0);

      const sorted = [...amounts].sort((a, b) => a - b);
      const baselineMin = amounts.length > 0 ? sorted[Math.floor(sorted.length * 0.1)] || 0 : 0;
      const baselineMax = amounts.length > 0 ? sorted[Math.floor(sorted.length * 0.9)] || 0 : 0;

      const hourCounts = new Array(24).fill(0);
      for (const tx of transactions) {
        const date = new Date(tx.timestamp || Date.now());
        hourCounts[date.getUTCHours()]++;
      }

      const totalTx = hourCounts.reduce((a, b) => a + b, 0);
      const sortedHours = hourCounts
        .map((count, hour) => ({ hour, count }))
        .sort((a, b) => b.count - a.count);

      let cumulative = 0;
      const activeHours: number[][] = [];
      for (const { hour, count } of sortedHours) {
        if (totalTx > 0 && cumulative / totalTx < 0.8) {
          activeHours.push([hour, hour]);
          cumulative += count;
        }
      }

      await SpendingDnaModel.findOneAndUpdate(
        { user_wallet_pubkey: walletPubkey },
        {
          user_wallet_pubkey: walletPubkey,
          daily_averages: dailyAverages,
          computed_baseline_min: baselineMin,
          computed_baseline_max: baselineMax,
          computed_active_hours: activeHours,
          last_computed_at: Date.now(),
        },
        { upsert: true },
      );

      logger.info('Spending DNA computed', { walletPubkey, dailyAverages: dailyAverages.length });
    } catch (error) {
      logger.error('Failed to compute spending DNA', {
        walletPubkey,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async processAllUsers(batchSize: number = 50): Promise<{ processed: number; failed: number }> {
    const devices = await DeviceRegistryModel.find({ status: 'active' }).limit(batchSize);
    let processed = 0;
    let failed = 0;

    for (const device of devices) {
      if (device.paired_user_id) {
        try {
          await this.computeForUser(device.paired_user_id);
          processed++;
          await this.sleep(200);
        } catch {
          failed++;
        }
      }
    }

    logger.info('Spending DNA batch processed', { processed, failed, batchSize });
    return { processed, failed };
  }

  async getBaseline(walletPubkey: string) {
    return SpendingDnaModel.findOne({ user_wallet_pubkey: walletPubkey });
  }

  async recordAnomaly(walletPubkey: string, anomaly: DetectedAnomaly): Promise<void> {
    await SpendingDnaModel.findOneAndUpdate(
      { user_wallet_pubkey: walletPubkey },
      {
        $push: {
          anomaly_history: {
            $each: [anomaly],
            $slice: -50,
          },
        },
      },
    );
  }

  private aggregateByDay(transactions: any[]): DailyTransactionSummary[] {
    const dayMap = new Map<string, {
      count: number;
      totalVolume: number;
      protocols: Set<string>;
      hours: number[];
    }>();

    for (const tx of transactions) {
      const date = new Date(tx.timestamp || Date.now());
      const dayKey = date.toISOString().split('T')[0]!;
      const hour = date.getUTCHours();

      if (!dayMap.has(dayKey)) {
        dayMap.set(dayKey, { count: 0, totalVolume: 0, protocols: new Set(), hours: new Array(24).fill(0) });
      }

      const entry = dayMap.get(dayKey)!;
      entry.count++;
      entry.totalVolume += Math.abs(tx.amount || 0);
      entry.hours[hour]++;
      if (tx.programId) entry.protocols.add(tx.programId);
    }

    return Array.from(dayMap.entries()).map(([date, data]) => ({
      date,
      transaction_count: data.count,
      total_volume_lamports: data.totalVolume,
      avg_transaction_lamports: data.count > 0 ? Math.floor(data.totalVolume / data.count) : 0,
      protocols_used: Array.from(data.protocols),
      hour_distribution: data.hours,
    }));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const spendingDnaService = new SpendingDnaService();
