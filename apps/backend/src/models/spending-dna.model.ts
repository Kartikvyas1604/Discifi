import mongoose, { Schema, Document } from 'mongoose';
import { COLLECTION_SPENDING_DNA } from '@discifi/shared';

export interface IDailySummary {
  date: string;
  transaction_count: number;
  total_volume_lamports: number;
  avg_transaction_lamports: number;
  protocols_used: string[];
  hour_distribution: number[];
}

export interface IAnomalyHistory {
  detected_at: number;
  transaction_hash: string;
  anomaly_type: string;
  resolved: boolean;
}

export interface ISpendingDna extends Document {
  user_wallet_pubkey: string;
  daily_averages: IDailySummary[];
  computed_baseline_min: number;
  computed_baseline_max: number;
  computed_active_hours: number[][];
  last_computed_at: number;
  anomaly_history: IAnomalyHistory[];
}

const DailySummarySchema = new Schema<IDailySummary>({
  date: { type: String, required: true },
  transaction_count: { type: Number, required: true },
  total_volume_lamports: { type: Number, required: true },
  avg_transaction_lamports: { type: Number, required: true },
  protocols_used: [{ type: String }],
  hour_distribution: { type: [Number], default: new Array(24).fill(0) },
}, { _id: false });

const AnomalyHistorySchema = new Schema<IAnomalyHistory>({
  detected_at: { type: Number, required: true },
  transaction_hash: { type: String, required: true },
  anomaly_type: { type: String, required: true },
  resolved: { type: Boolean, default: false },
}, { _id: false });

const SpendingDnaSchema = new Schema<ISpendingDna>({
  user_wallet_pubkey: { type: String, required: true, unique: true, index: true },
  daily_averages: { type: [DailySummarySchema], default: [] },
  computed_baseline_min: { type: Number, default: 0 },
  computed_baseline_max: { type: Number, default: 0 },
  computed_active_hours: { type: [[Number]], default: [] },
  last_computed_at: { type: Number, default: 0 },
  anomaly_history: { type: [AnomalyHistorySchema], default: [] },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: COLLECTION_SPENDING_DNA });

SpendingDnaSchema.index({ user_wallet_pubkey: 1, last_computed_at: -1 });
export const SpendingDnaModel = mongoose.model<ISpendingDna>('SpendingDna', SpendingDnaSchema);
