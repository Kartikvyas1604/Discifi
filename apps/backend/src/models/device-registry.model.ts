import mongoose, { Schema, Document } from 'mongoose';
import { COLLECTION_DEVICE_REGISTRY } from '@discifi/shared';

export interface ISyncEvent {
  timestamp: number;
  event_type: 'pair' | 'sync' | 'unpair' | 'wipe';
  details: string;
}

export interface IDeviceRegistry extends Document {
  device_id: string;
  hardware_attestation_certificate: Buffer;
  firmware_version: string;
  paired_user_id: string | null;
  paired_at: number | null;
  last_sync_at: number | null;
  sync_history: ISyncEvent[];
  platform: 'ios' | 'android';
  app_version: string;
  status: 'active' | 'suspended' | 'wiped';
  device_pubkey: string;
  created_at: Date;
  updated_at: Date;
}

const SyncEventSchema = new Schema<ISyncEvent>({
  timestamp: { type: Number, required: true },
  event_type: { type: String, enum: ['pair', 'sync', 'unpair', 'wipe'], required: true },
  details: { type: String, required: true },
}, { _id: false });

const DeviceRegistrySchema = new Schema<IDeviceRegistry>({
  device_id: { type: String, required: true, unique: true, index: true },
  hardware_attestation_certificate: { type: Buffer, required: true },
  firmware_version: { type: String, required: true },
  paired_user_id: { type: String, default: null, index: true },
  paired_at: { type: Number, default: null },
  last_sync_at: { type: Number, default: null },
  sync_history: { type: [SyncEventSchema], default: [] },
  platform: { type: String, enum: ['ios', 'android'], required: true },
  app_version: { type: String, required: true },
  status: { type: String, enum: ['active', 'suspended', 'wiped'], default: 'active', index: true },
  device_pubkey: { type: String, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: COLLECTION_DEVICE_REGISTRY });

DeviceRegistrySchema.index({ paired_user_id: 1, status: 1 });
export const DeviceRegistryModel = mongoose.model<IDeviceRegistry>('DeviceRegistry', DeviceRegistrySchema);
