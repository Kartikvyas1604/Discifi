import crypto from 'node:crypto';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import { logger } from '../config/logger.js';
import { PrivacyRoutingError } from '../errors/index.js';
import type { StealthMeta, StealthTransfer } from '@discifi/shared';

export interface StealthKeypair {
  spendPublicKey: string;
  spendPrivateKeyEncrypted: string;
  viewPublicKey: string;
  viewPrivateKeyEncrypted: string;
}

export class StealthAddressService {
  generateStealthKeys(devicePublicKeyBase64: string): StealthKeypair {
    try {
      const spendKeypair = nacl.box.keyPair();
      const viewKeypair = nacl.box.keyPair();

      const devicePubKey = naclUtil.decodeBase64(devicePublicKeyBase64);

      const spendEphemeral = nacl.box.keyPair();
      const spendSharedSecret = nacl.box.before(spendEphemeral.publicKey, devicePubKey);
      const spendEncrypted = nacl.secretbox(
        spendKeypair.secretKey,
        new Uint8Array(24),
        spendSharedSecret.slice(0, 32),
      );

      const viewEphemeral = nacl.box.keyPair();
      const viewSharedSecret = nacl.box.before(viewEphemeral.publicKey, devicePubKey);
      const viewEncrypted = nacl.secretbox(
        viewKeypair.secretKey,
        new Uint8Array(24),
        viewSharedSecret.slice(0, 32),
      );

      return {
        spendPublicKey: naclUtil.encodeBase64(spendKeypair.publicKey),
        spendPrivateKeyEncrypted: spendEncrypted ? naclUtil.encodeBase64(spendEncrypted) : '',
        viewPublicKey: naclUtil.encodeBase64(viewKeypair.publicKey),
        viewPrivateKeyEncrypted: viewEncrypted ? naclUtil.encodeBase64(viewEncrypted) : '',
      };
    } catch (error) {
      logger.error('Failed to generate stealth keys', { error: error instanceof Error ? error.message : String(error) });
      throw new PrivacyRoutingError('Failed to generate stealth address keys');
    }
  }

  computeStealthAddress(spendPubkey: string, viewPubkey: string): string {
    const combined = crypto.createHash('sha256')
      .update(spendPubkey + viewPubkey)
      .digest('hex');
    return `Stealth${combined.substring(0, 40)}`;
  }

  async findClaimableTransfers(
    viewPubkey: string,
    allTransfers: StealthTransfer[],
  ): Promise<StealthTransfer[]> {
    const claimable: StealthTransfer[] = [];
    for (const transfer of allTransfers) {
      if (!transfer.claimed) {
        claimable.push(transfer);
      }
    }
    return claimable;
  }
}

export const stealthAddressService = new StealthAddressService();
