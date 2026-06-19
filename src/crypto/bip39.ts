import { wordlist } from '@scure/bip39/wordlists/english';
import { sha256, hmac } from '@noble/hashes/sha256';
import { sha512 } from '@noble/hashes/sha512';
import { pbkdf2Async } from '@noble/hashes/pbkdf2';

export { wordlist };

function normalize(str: string): string {
  return str.normalize('NFKD');
}

function entropyToBits(entropy: Uint8Array): string {
  return Array.from(entropy)
    .map(b => b.toString(2).padStart(8, '0'))
    .join('');
}

function bitsToBytes(bits: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return new Uint8Array(bytes);
}

export function generateChecksum(entropy: Uint8Array): string {
  const hash = sha256(entropy);
  const checksumBits = (entropy.length * 8) / 32;
  const hashBits = Array.from(hash)
    .map(b => b.toString(2).padStart(8, '0'))
    .join('');
  return hashBits.slice(0, checksumBits);
}

export function entropyToMnemonic(entropy: Uint8Array): string[] {
  const entropyBits = entropyToBits(entropy);
  const checksum = generateChecksum(entropy);
  const combined = entropyBits + checksum;

  const words: string[] = [];
  for (let i = 0; i < combined.length; i += 11) {
    const index = parseInt(combined.slice(i, i + 11), 2);
    words.push(wordlist[index]);
  }
  return words;
}

export function mnemonicToEntropy(words: string[]): Uint8Array {
  const bits = words
    .map(w => {
      const idx = wordlist.indexOf(w);
      if (idx === -1) throw new Error(`Word "${w}" not in BIP39 wordlist`);
      return idx.toString(2).padStart(11, '0');
    })
    .join('');

  const checksumBits = bits.length / 33;
  const entropyBits = bits.slice(0, bits.length - checksumBits);
  return bitsToBytes(entropyBits);
}

export function validateMnemonic(words: string[]): { valid: boolean; error?: string } {
  if (![12, 15, 18, 21, 24].includes(words.length)) {
    return { valid: false, error: `Invalid word count: ${words.length}. Must be 12, 15, 18, 21, or 24.` };
  }

  for (const w of words) {
    if (!wordlist.includes(w)) {
      return { valid: false, error: `Word "${w}" is not in the BIP39 English wordlist` };
    }
  }

  const bits = words
    .map(w => wordlist.indexOf(w).toString(2).padStart(11, '0'))
    .join('');

  const checksumBits = bits.length / 33;
  const entropyBits = bits.slice(0, bits.length - checksumBits);
  const storedChecksum = bits.slice(bits.length - checksumBits);

  const entropy = bitsToBytes(entropyBits);
  const computedChecksum = generateChecksum(entropy);

  if (storedChecksum !== computedChecksum) {
    return { valid: false, error: 'Checksum mismatch — one or more words may be incorrect or in the wrong order' };
  }

  return { valid: true };
}

export async function mnemonicToSeed(mnemonic: string[], passphrase: string = ''): Promise<Uint8Array> {
  const mnemonicStr = normalize(mnemonic.join(' '));
  const salt = normalize('mnemonic' + passphrase);

  const key = await pbkdf2Async(sha512, mnemonicStr, salt, { c: 2048, dkLen: 64 });
  return key;
}

export async function generateMnemonic(strength: 128 | 256 = 256): Promise<{ entropy: Uint8Array; mnemonic: string[] }> {
  const byteLength = strength / 8;
  const entropy = new Uint8Array(byteLength);

  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(entropy);
  } else {
    const { getRandomBytesAsync } = require('expo-crypto');
    const bytes = await getRandomBytesAsync(byteLength);
    entropy.set(bytes);
  }

  const mnemonic = entropyToMnemonic(entropy);

  const validation = validateMnemonic(mnemonic);
  if (!validation.valid) {
    throw new Error(`Generated mnemonic failed validation: ${validation.error}`);
  }

  return { entropy, mnemonic };
}

export function clearBytes(data: Uint8Array): void {
  data.fill(0);
}
