import mongoose, { Schema, Document } from 'mongoose';
import { COLLECTION_NOTIFICATION_QUEUE } from '@discifi/shared';

export interface INotificationQueue extends Document {
  user_device_token: string;
  notification_type: string;
  message: string;
  payload: Record<string, unknown>;
  created_at: Date;
  delivered_at: Date | null;
  status: 'pending' | 'delivered' | 'failed';
}

const NotificationQueueSchema = new Schema<INotificationQueue>({
  user_device_token: { type: String, required: true },
  notification_type: { type: String, enum: ['rule_blocked', 'drain_detected', 'approval_expiring', 'multisig_required', 'inheritance_heartbeat_due', 'anomaly_detected'], required: true },
  message: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, default: {} },
  delivered_at: { type: Date, default: null },
  status: { type: String, enum: ['pending', 'delivered', 'failed'], default: 'pending', index: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: COLLECTION_NOTIFICATION_QUEUE });

NotificationQueueSchema.index({ status: 1, created_at: 1 });
NotificationQueueSchema.index({ created_at: 1 }, { expireAfterSeconds: 604800 });

export const NotificationQueueModel = mongoose.model<INotificationQueue>('NotificationQueue', NotificationQueueSchema);
