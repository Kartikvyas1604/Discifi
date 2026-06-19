export interface DerivedKeypair {
  path: string;
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  address: string;
}

export interface WalletSet {
  hot: DerivedKeypair;
  vault: DerivedKeypair;
  dao: DerivedKeypair;
  stealthSpend: DerivedKeypair;
  stealthView: DerivedKeypair;
}

export interface MnemonicResult {
  mnemonic: string[];
  seed: Uint8Array;
  entropy: Uint8Array;
}
