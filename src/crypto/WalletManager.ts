import { generateMnemonic, mnemonicToSeed, validateMnemonic, clearBytes, entropyToMnemonic } from './bip39';
import { deriveWalletSet, deriveKeypair } from './address';
import type { WalletSet, MnemonicResult, DerivedKeypair } from './types';

export interface WalletManagerOptions {
  strength?: 128 | 256;
  passphrase?: string;
}

export class WalletManager {
  private mnemonic: string[] | null = null;
  private entropy: Uint8Array | null = null;
  private seed: Uint8Array | null = null;
  private wallets: WalletSet | null = null;

  async createWallet(options: WalletManagerOptions = {}): Promise<MnemonicResult> {
    const strength = options.strength ?? 256;
    const { entropy, mnemonic } = await generateMnemonic(strength);
    this.mnemonic = mnemonic;
    this.entropy = entropy;
    return { mnemonic, seed: new Uint8Array(0), entropy };
  }

  async deriveFromMnemonic(passphrase: string = ''): Promise<WalletSet> {
    if (!this.mnemonic) throw new Error('No mnemonic loaded. Call createWallet or restoreWallet first.');
    const seed = await mnemonicToSeed(this.mnemonic, passphrase);
    this.seed = new Uint8Array(seed);
    this.wallets = deriveWalletSet(this.seed);
    return this.wallets;
  }

  restoreWallet(words: string[], passphrase: string = ''): { valid: boolean; error?: string; wallets?: WalletSet } {
    const validation = validateMnemonic(words);
    if (!validation.valid) {
      return { valid: false, error: validation.error };
    }
    this.mnemonic = [...words];
    return { valid: true };
  }

  getMnemonic(): string[] | null {
    return this.mnemonic ? [...this.mnemonic] : null;
  }

  getWallets(): WalletSet | null {
    return this.wallets ? { ...this.wallets } : null;
  }

  clearSensitiveData(): void {
    if (this.seed) clearBytes(this.seed);
    if (this.entropy) clearBytes(this.entropy);
    if (this.mnemonic) {
      this.mnemonic.fill('');
      this.mnemonic = null;
    }
    this.seed = null;
    this.entropy = null;
    this.wallets = null;
  }
}
