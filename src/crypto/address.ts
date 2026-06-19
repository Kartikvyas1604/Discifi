import bs58 from 'bs58';
import { derivePath, getPublicKey } from './slip10';
import type { DerivedKeypair, WalletSet } from './types';

const DERIVATION_PATHS = {
  hot: "m/44'/501'/0'/0'",
  vault: "m/44'/501'/1'/0'",
  dao: "m/44'/501'/2'/0'",
  stealthSpend: "m/44'/501'/3'/0'",
  stealthView: "m/44'/501'/4'/0'",
};

export function publicKeyToAddress(publicKey: Uint8Array): string {
  if (publicKey.length !== 32) {
    throw new Error(`Invalid public key length: ${publicKey.length}. Expected 32 bytes.`);
  }

  const address = bs58.encode(publicKey);

  if (address.length < 32 || address.length > 44) {
    throw new Error(`Generated invalid address: length ${address.length}`);
  }

  return address;
}

export function deriveKeypair(seed: Uint8Array, path: string): DerivedKeypair {
  const { key: privateKey } = derivePath(seed, path);
  const publicKey = getPublicKey(privateKey);
  const address = publicKeyToAddress(publicKey);

  return { path, privateKey, publicKey, address };
}

export function validateAddress(address: string): boolean {
  try {
    const decoded = bs58.decode(address);
    return decoded.length === 32;
  } catch {
    return false;
  }
}

export function deriveWalletSet(seed: Uint8Array): WalletSet {
  return {
    hot: deriveKeypair(seed, DERIVATION_PATHS.hot),
    vault: deriveKeypair(seed, DERIVATION_PATHS.vault),
    dao: deriveKeypair(seed, DERIVATION_PATHS.dao),
    stealthSpend: deriveKeypair(seed, DERIVATION_PATHS.stealthSpend),
    stealthView: deriveKeypair(seed, DERIVATION_PATHS.stealthView),
  };
}

export function deriveAccount(seed: Uint8Array, accountIndex: number): DerivedKeypair {
  const path = `m/44'/501'/${accountIndex}'/0'`;
  return deriveKeypair(seed, path);
}
