import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { getConfig } from '../config/env.js';
import { AuthenticationError, DeviceError } from '../errors/index.js';
import { logger } from '../config/logger.js';
import { DeviceRegistryModel } from '../models/device-registry.model.js';
import { getRedisClient } from '../config/redis.js';
import {
  REDIS_FAILED_ATTEMPTS, FAILED_ATTEMPT_THRESHOLD, FAILED_ATTEMPT_WINDOW_MINUTES,
} from '@discifi/shared';

interface JwtPayload {
  device_id: string;
  paired_user_id: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends FastifyRequest {
  deviceId: string;
  pairedUserId: string;
}

function extractToken(req: FastifyRequest): string {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new AuthenticationError('Missing Authorization header');
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') throw new AuthenticationError('Invalid Authorization header format');
  return parts[1]!;
}

export async function authenticateRequest(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const token = extractToken(req);
  try {
    const { JWT_SECRET } = getConfig();
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as AuthenticatedRequest).deviceId = decoded.device_id;
    (req as AuthenticatedRequest).pairedUserId = decoded.paired_user_id;
  } catch (error) {
    if (error instanceof AuthenticationError) throw error;
    throw new AuthenticationError('Invalid or expired token', { error: error instanceof Error ? error.message : String(error) });
  }
}

export async function verifyDeviceSignature(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const deviceId = (req as AuthenticatedRequest).deviceId;
  const deviceSignature = req.headers['x-device-signature'] as string;
  if (!deviceSignature) throw new DeviceError('Missing X-Device-Signature header');

  const device = await DeviceRegistryModel.findOne({ device_id: deviceId, status: 'active' });
  if (!device) throw new DeviceError('Device not found or not active');
  if (device.status === 'suspended') throw new DeviceError('Device is suspended. Contact support.');
  if (device.status === 'wiped') throw new DeviceError('Device has been wiped. Re-pair required.');

  const requestPayload = JSON.stringify({ method: req.method, url: req.url, body: req.body, timestamp: req.headers['x-timestamp'] });
  const nacl = await import('tweetnacl');
  const naclUtil = await import('tweetnacl-util');
  const signatureBytes = naclUtil.decodeBase64(deviceSignature);
  const messageBytes = naclUtil.decodeUTF8(requestPayload);
  const publicKeyBytes = naclUtil.decodeBase64(device.device_pubkey);
  const verified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

  if (!verified) {
    const redis = getRedisClient();
    const redisKey = `${REDIS_FAILED_ATTEMPTS}:${deviceId}`;
    const attempts = await redis.incr(redisKey);
    if (attempts === 1) await redis.expire(redisKey, FAILED_ATTEMPT_WINDOW_MINUTES * 60);
    if (attempts >= FAILED_ATTEMPT_THRESHOLD) {
      await DeviceRegistryModel.updateOne({ device_id: deviceId }, { $set: { status: 'suspended' } });
      logger.warn('Device suspended due to failed auth attempts', { deviceId });
    }
    throw new AuthenticationError('Device signature verification failed');
  }
  await getRedisClient().del(`${REDIS_FAILED_ATTEMPTS}:${deviceId}`);
}
