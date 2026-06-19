import mongoose, { Schema, Document } from 'mongoose';
import { COLLECTION_PHISHING_REGISTRY } from '@discifi/shared';

export interface IPhishingRegistry extends Document {
  domain: string;
  threat_type: 'phishing' | 'drain' | 'fake_mint' | 'malicious_contract';
  reported_by: string;
  reported_at: number;
  confirmed: boolean;
  confirmed_at: number | null;
  sources: string[];
  risk_score: number;
}

const PhishingRegistrySchema = new Schema<IPhishingRegistry>({
  domain: { type: String, required: true, unique: true, index: true },
  threat_type: { type: String, enum: ['phishing', 'drain', 'fake_mint', 'malicious_contract'], required: true, index: true },
  reported_by: { type: String, required: true },
  reported_at: { type: Number, required: true },
  confirmed: { type: Boolean, default: false, index: true },
  confirmed_at: { type: Number, default: null },
  sources: [{ type: String }],
  risk_score: { type: Number, default: 0, min: 0, max: 100, index: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: COLLECTION_PHISHING_REGISTRY });

PhishingRegistrySchema.index({ threat_type: 1, confirmed: 1, risk_score: -1 });
export const PhishingRegistryModel = mongoose.model<IPhishingRegistry>('PhishingRegistry', PhishingRegistrySchema);
