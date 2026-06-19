import { hmac } from '@noble/hashes/sha256';
import { sha512 } from '@noble/hashes/sha512';
import * as nacl from 'tweetnacl';

const HARDENED_OFFSET = 0x80000000;

function hmacSHA512(key: Uint8Array, data: Uint8Array): Uint8Array {
  const h = hmac.create(sha512, key);
  h.update(data);
  return h.digest();
}

function i2osp(value: number, length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  for (let i = length - 1; i >= 0; i--) {
    bytes[i] = value & 0xff;
    value >>>= 8;
  }
  return bytes;
}

export function isValidEd25519PrivateKey(key: Uint8Array): boolean {
  if (key.length !== 32) return false;
  const clamped = new Uint8Array(key);

  clamped[0] &= 248;
  clamped[31] &= 127;
  clamped[31] |= 64;

  const allZero = clamped.every(b => b === 0);
  return !allZero;
}

export function deriveMasterKey(seed: Uint8Array): { key: Uint8Array; chainCode: Uint8Array } {
  const digest = hmacSHA512(
    new TextEncoder().encode('ed25519 seed'),
    seed,
  );

  const key = digest.slice(0, 32);
  const chainCode = digest.slice(32, 64);

  if (!isValidEd25519PrivateKey(key)) {
    throw new Error('Invalid master key — this is extremely rare and indicates entropy failure');
  }

  return { key, chainCode };
}

export function deriveChildKey(parentKey: Uint8Array, parentChainCode: Uint8Array, index: number): { key: Uint8Array; chainCode: Uint8Array } {
  const hardenedIndex = index | HARDENED_OFFSET;

  const data = new Uint8Array(1 + 32 + 4);
  data[0] = 0x00;
  data.set(parentKey, 1);
  data.set(i2osp(hardenedIndex, 4), 33);

  const digest = hmacSHA512(parentChainCode, data);

  const key = digest.slice(0, 32);
  const chainCode = digest.slice(32, 64);

  if (!isValidEd25519PrivateKey(key)) {
    return deriveChildKey(parentKey, parentChainCode, index + 1);
  }

  return { key, chainCode };
}

export function parseDerivationPath(path: string): number[] {
  if (!path.startsWith('m')) {
    throw new Error(`Invalid derivation path: ${path}. Must start with 'm'.`);
  }

  if (path === 'm') return [];

  const segments = path.slice(2).split('/');

  return segments.map(seg => {
    const trimmed = seg.trim();
    const hardened = trimmed.endsWith("'") || trimmed.endsWith('h');
    const numStr = hardened ? trimmed.slice(0, -1) : trimmed;
    const num = parseInt(numStr, 10);

    if (isNaN(num) || num < 0) {
      throw new Error(`Invalid derivation path segment: ${seg}`);
    }

    if (hardened) {
      return num | HARDENED_OFFSET;
    }
    return num;
  });
}

export function derivePath(seed: Uint8Array, path: string): { key: Uint8Array; chainCode: Uint8Array } {
  const indices = parseDerivationPath(path);
  let { key, chainCode } = deriveMasterKey(seed);

  for (const index of indices) {
    const child = deriveChildKey(key, chainCode, index);
    key = child.key;
    chainCode = child.chainCode;
  }

  return { key, chainCode };
}

export function getPublicKey(privateKey: Uint8Array): Uint8Array {
  const keypair = nacl.sign.keyPair.fromSeed(privateKey);
  return keypair.publicKey;
}
