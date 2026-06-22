import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { PublicKey } from '@solana/web3.js';
import { getPubKey, getMnemonic } from './secureStorage';
import { mnemonicToSeed } from '../crypto/bip39';
import { deriveKeypair } from '../crypto/address';
import type { WalletSet } from '../crypto/types';
import { Buffer } from 'buffer';

interface WalletContextType {
  walletSet: WalletSet | null;
  hotPublicKey: PublicKey | null;
  vaultPublicKey: PublicKey | null;
  hotAddress: string;
  vaultAddress: string;
  derivePrivateKey: () => Promise<Uint8Array | null>;
  isLoading: boolean;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ walletSet, children }: { walletSet: WalletSet | null; children: ReactNode }) {
  const [hotPublicKey, setHotPublicKey] = useState<PublicKey | null>(null);
  const [vaultPublicKey, setVaultPublicKey] = useState<PublicKey | null>(null);

  useEffect(() => {
    if (walletSet) {
      try {
        const hpk = new PublicKey(walletSet.hot.address);
        const vpk = new PublicKey(walletSet.vault.address);
        setHotPublicKey(hpk);
        setVaultPublicKey(vpk);
      } catch {
        setHotPublicKey(null);
        setVaultPublicKey(null);
      }
    }
  }, [walletSet]);

  async function derivePrivateKey(): Promise<Uint8Array | null> {
    try {
      const mnemonicStr = await getMnemonic();
      if (!mnemonicStr) return null;
      const words = mnemonicStr.split(' ');
      const seed = await mnemonicToSeed(words, '');
      const kp = deriveKeypair(seed, "m/44'/501'/0'/0'");
      return kp.privateKey;
    } catch {
      return null;
    }
  }

  const value: WalletContextType = {
    walletSet,
    hotPublicKey,
    vaultPublicKey,
    hotAddress: walletSet?.hot.address || '',
    vaultAddress: walletSet?.vault.address || '',
    derivePrivateKey,
    isLoading: !walletSet,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
