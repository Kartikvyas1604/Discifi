import mongoose, { Schema, Document } from 'mongoose';
import { COLLECTION_SIMULATION_CACHE } from '@discifi/shared';

export interface ISimulationCache extends Document {
  transaction_hash: string;
  simulation_result: Record<string, unknown>;
  expected_outcome: string;
  actual_outcome: string;
  mismatch_detected: boolean;
  simulated_at: Date;
  chain_id: string;
}

const SimulationCacheSchema = new Schema<ISimulationCache>({
  transaction_hash: { type: String, required: true, unique: true, index: true },
  simulation_result: { type: Schema.Types.Mixed, required: true },
  expected_outcome: { type: String, required: true },
  actual_outcome: { type: String, required: true },
  mismatch_detected: { type: Boolean, default: false },
  simulated_at: { type: Date, required: true, index: { expires: 30 } },
  chain_id: { type: String, required: true },
}, { timestamps: true, collection: COLLECTION_SIMULATION_CACHE });

export const SimulationCacheModel = mongoose.model<ISimulationCache>('SimulationCache', SimulationCacheSchema);
