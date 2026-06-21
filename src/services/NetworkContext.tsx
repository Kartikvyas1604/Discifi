import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { Alert } from 'react-native';
import { Connection, type Commitment } from '@solana/web3.js';
import { RPC_ENDPOINTS, HELIUS_API_KEY } from './constants';
import { storeNetwork, getNetwork } from './secureStorage';
import type { Network } from './types';

interface NetworkContextType {
  network: Network;
  setNetwork: (n: Network) => Promise<void>;
  connection: Connection;
  explorerUrl: string;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

function createConnection(network: Network): Connection {
  const endpoints = RPC_ENDPOINTS[network];
  const commitment: Commitment = 'confirmed';
  // Without Helius API key, use public Solana RPC (rate-limited but no auth needed)
  const url = HELIUS_API_KEY ? endpoints.primary : endpoints.fallback;
  const ws = HELIUS_API_KEY ? endpoints.ws : undefined;
  return new Connection(url, {
    commitment,
    ...(ws ? { wsEndpoint: ws } : {}),
    confirmTransactionInitialTimeout: 60000,
  });
}

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [network, setNetworkState] = useState<Network>('devnet');
  const [connection, setConnection] = useState<Connection>(() => createConnection('devnet'));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getNetwork().then(saved => {
      if (saved) {
        setNetworkState(saved);
        setConnection(createConnection(saved));
      }
      setReady(true);
    });
  }, []);

  const setNetwork = useCallback(async (n: Network) => {
    if (n === 'mainnet' && network !== 'mainnet') {
      await new Promise<void>(resolve => {
        Alert.alert(
          'Switch to Mainnet',
          'You are switching to Mainnet. This uses real money. Are you sure?',
          [
            { text: 'Cancel', style: 'cancel', onPress: resolve },
            {
              text: 'Switch to Mainnet',
              style: 'destructive',
              onPress: async () => {
                setNetworkState(n);
                setConnection(createConnection(n));
                await storeNetwork(n);
                resolve();
              },
            },
          ],
        );
      });
    } else {
      setNetworkState(n);
      setConnection(createConnection(n));
      await storeNetwork(n);
    }
  }, [network]);

  const explorerBase = {
    mainnet: 'https://explorer.solana.com',
    devnet: 'https://explorer.solana.com?cluster=devnet',
    testnet: 'https://explorer.solana.com?cluster=testnet',
  };

  const value = useMemo<NetworkContextType>(() => ({
    network,
    setNetwork,
    connection,
    explorerUrl: explorerBase[network],
  }), [network, setNetwork, connection]);

  if (!ready) return null;

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextType {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork must be used within NetworkProvider');
  return ctx;
}
