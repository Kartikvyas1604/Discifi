import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { getConfig } from '../config/env.js';
import { logger } from '../config/logger.js';
import { DeviceRegistryModel } from '../models/device-registry.model.js';
import { getRedisClient } from '../config/redis.js';
import { DeviceError, AuthenticationError } from '../errors/index.js';
import {
  JWT_EXPIRY_SECONDS, REFRESH_TOKEN_EXPIRY_DAYS, REDIS_REFRESH,
  FAILED_ATTEMPT_THRESHOLD, FAILED_ATTEMPT_WINDOW_MINUTES, REDIS_FAILED_ATTEMPTS,
} from '@discifi/shared';
import type { DeviceRegistrationRequest, DeviceRegistrationResponse, DeviceAuthRequest, DeviceAuthResponse } from '@discifi/shared';

export class DeviceAuthService {
  async registerDevice(request: DeviceRegistrationRequest): Promise<DeviceRegistrationResponse> {
    const { device_id, attestation_certificate, firmware_version, platform, app_version } = request;
    const { DEVICE_CA_CERTIFICATE, JWT_SECRET } = getConfig();

    const devicePubkey = this.verifyAttestationCertificate(attestation_certificate, DEVICE_CA_CERTIFICATE);

    await DeviceRegistryModel.findOneAndUpdate(
      { device_id },
      {
        device_id,
        hardware_attestation_certificate: Buffer.from(attestation_certificate, 'utf-8'),
        firmware_version,
        platform,
        app_version,
        device_pubkey: devicePubkey,
        status: 'active',
        $push: { sync_history: { timestamp: Date.now(), event_type: 'pair', details: 'Device registered' } },
      },
      { upsert: true, new: true },
    );

    logger.info('Device registered', { device_id, platform, firmware_version });

    const sessionToken = this.generateSessionToken(device_id, JWT_SECRET);
    const refreshToken = this.generateRefreshToken();

    const redis = getRedisClient();
    await redis.setex(`${REDIS_REFRESH}:${device_id}`, REFRESH_TOKEN_EXPIRY_DAYS * 86400, refreshToken);

    return { device_id, session_token: sessionToken, refresh_token: refreshToken, expires_in: JWT_EXPIRY_SECONDS };
  }

  async authenticateDevice(request: DeviceAuthRequest): Promise<DeviceAuthResponse> {
    const { device_id, signature, challenge } = request;
    const { JWT_SECRET } = getConfig();

    const device = await DeviceRegistryModel.findOne({ device_id, status: 'active' });
    if (!device) throw new DeviceError('Device not found or not active');

    const redis = getRedisClient();
    const failedKey = `${REDIS_FAILED_ATTEMPTS}:${device_id}`;
    const attempts = await redis.get(failedKey);
    if (attempts && parseInt(attempts, 10) >= FAILED_ATTEMPT_THRESHOLD) {
      throw new DeviceError('Device is temporarily suspended due to too many failed attempts');
    }

    const verified = this.verifyEd25519Signature(challenge, signature, device.device_pubkey);
    if (!verified) {
      const count = await redis.incr(failedKey);
      if (count === 1) await redis.expire(failedKey, FAILED_ATTEMPT_WINDOW_MINUTES * 60);
      if (count >= FAILED_ATTEMPT_THRESHOLD) {
        await DeviceRegistryModel.updateOne({ device_id }, { $set: { status: 'suspended' } });
        logger.warn('Device suspended due to failed auth', { device_id });
      }
      throw new AuthenticationError('Invalid device signature');
    }

    await redis.del(failedKey);
    const sessionToken = this.generateSessionToken(device_id, JWT_SECRET);
    const refreshToken = this.generateRefreshToken();
    await redis.setex(`${REDIS_REFRESH}:${device_id}`, REFRESH_TOKEN_EXPIRY_DAYS * 86400, refreshToken);

    return { session_token: sessionToken, refresh_token: refreshToken, expires_in: JWT_EXPIRY_SECONDS };
  }

  async suspendDevice(deviceId: string): Promise<void> {
    await DeviceRegistryModel.updateOne({ device_id: deviceId }, { $set: { status: 'suspended' } });
    const redis = getRedisClient();
    await redis.del(`${REDIS_REFRESH}:${deviceId}`);
    await redis.del(`${REDIS_FAILED_ATTEMPTS}:${deviceId}`);
    logger.warn('Device suspended', { deviceId });
  }

  async wipeDevice(deviceId: string): Promise<void> {
    await DeviceRegistryModel.updateOne(
      { device_id: deviceId },
      {
        $set: { status: 'wiped', paired_user_id: null, paired_at: null },
        $push: { sync_history: { timestamp: Date.now(), event_type: 'wipe', details: 'Emergency wipe' } },
      },
    );
    const redis = getRedisClient();
    await redis.del(`${REDIS_REFRESH}:${deviceId}`);
    await redis.del(`${REDIS_FAILED_ATTEMPTS}:${deviceId}`);
    logger.warn('Device wiped', { deviceId });
  }

  async refreshToken(deviceId: string, refreshToken: string): Promise<DeviceAuthResponse> {
    const redis = getRedisClient();
    const stored = await redis.get(`${REDIS_REFRESH}:${deviceId}`);
    if (!stored || stored !== refreshToken) throw new AuthenticationError('Invalid or expired refresh token');

    const { JWT_SECRET } = getConfig();
    const sessionToken = this.generateSessionToken(deviceId, JWT_SECRET);
    const newRefreshToken = this.generateRefreshToken();
    await redis.setex(`${REDIS_REFRESH}:${deviceId}`, REFRESH_TOKEN_EXPIRY_DAYS * 86400, newRefreshToken);

    return { session_token: sessionToken, refresh_token: newRefreshToken, expires_in: JWT_EXPIRY_SECONDS };
  }

  private verifyAttestationCertificate(certPem: string, caCertPem: string): string {
    try {
      const cert = new crypto.X509Certificate(certPem);
      const caCert = new crypto.X509Certificate(caCertPem);
      const isIssued = cert.checkIssued(caCert);
      if (!isIssued) throw new DeviceError('Certificate not issued by trusted CA');

      const verified = cert.verify(caCert.publicKey);
      if (!verified) throw new DeviceError('Certificate signature verification failed');

      const publicKey = cert.publicKey;
      const keyDer = publicKey.export({ type: 'spki', format: 'der' });
      return keyDer.toString('base64');
    } catch (error) {
      if (error instanceof DeviceError) throw error;
      throw new DeviceError('Certificate verification failed', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private generateSessionToken(deviceId: string, secret: string): string {
    return jwt.sign(
      { device_id: deviceId, paired_user_id: deviceId },
      secret,
      { expiresIn: JWT_EXPIRY_SECONDS },
    );
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  private verifyEd25519Signature(message: string, signature: string, publicKeyBase64: string): boolean {
    try {
      const nacl = require('tweetnacl');
      const naclUtil = require('tweetnacl-util');
      const sigBytes = naclUtil.decodeBase64(signature);
      const msgBytes = naclUtil.decodeUTF8(message);
      const pubBytes = naclUtil.decodeBase64(publicKeyBase64);
      return nacl.sign.detached.verify(msgBytes, sigBytes, pubBytes);
    } catch {
      return false;
    }
  }
}

export const deviceAuthService = new DeviceAuthService();
