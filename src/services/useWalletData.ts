import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { PublicKey, Connection } from '@solana/web3.js';
import { useNetwork } from './NetworkContext';
import { fetchWalletData, fetchSOLBalance } from './walletDataService';
import { fetchTransactionHistory, type HeliusTx } from './transactionService';
import { RPC_ENDPOINTS, HELIUS_TRANSACTIONS_URL } from './constants';
import type { WalletData, ParsedTransaction, TokenBalance } from './types';

export interface UseWalletDataResult {
  walletData: WalletData;
  transactions: ParsedTransaction[];
  refetch: () => Promise<void>;
  refetching: boolean;
}

export function useWalletData(publicKey: PublicKey | null): UseWalletDataResult {
  const { connection, network } = useNetwork();
  const [walletData, setWalletData] = useState<WalletData>({
    solBalance: 0,
    solUsdValue: 0,
    tokens: [],
    totalUsdValue: 0,
    change24h: 0,
    lastUpdated: new Date(),
    loading: true,
  });
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [refetching, setRefetching] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const fetch = useCallback(async () => {
    if (!publicKey) return;
    setRefetching(true);
    try {
      const [data, txs] = await Promise.allSettled([
        fetchWalletData(connection, publicKey),
        fetchTransactionHistory(connection, publicKey, HELIUS_TRANSACTIONS_URL),
      ]);

      if (data.status === 'fulfilled') {
        setWalletData({ ...data.value, loading: false });
      } else {
        let solBalance = 0;
        try {
          const fallbackUrl = RPC_ENDPOINTS[network]?.fallback;
          if (fallbackUrl) {
            const fallbackConn = new Connection(fallbackUrl, 'confirmed');
            solBalance = await fetchSOLBalance(fallbackConn, publicKey);
          }
        } catch {}
        setWalletData(prev => ({
          ...prev,
          solBalance,
          solUsdValue: 0,
          loading: false,
          lastUpdated: new Date(),
        }));
      }

      if (txs.status === 'fulfilled') {
        setTransactions(txs.value);
      }
    } catch {
      setWalletData(prev => ({ ...prev, loading: false }));
    } finally {
      setRefetching(false);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    fetch();
    intervalRef.current = setInterval(fetch, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetch]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        fetch();
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [fetch]);

  return { walletData, transactions, refetch: fetch, refetching };
}
