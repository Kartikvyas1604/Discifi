import { Platform } from 'react-native';

// Helius API key – in production load from env
export const HELIUS_API_KEY = 'YOUR_HELIUS_API_KEY';

export const RPC_ENDPOINTS = {
  mainnet: {
    primary: `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
    ws: `wss://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
    fallback: 'https://api.mainnet-beta.solana.com',
  },
  devnet: {
    primary: `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
    ws: `wss://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
    fallback: 'https://api.devnet.solana.com',
  },
  testnet: {
    primary: 'https://api.testnet.solana.com',
    ws: 'wss://api.testnet.solana.com',
    fallback: 'https://api.testnet.solana.com',
  },
};

export const HELIUS_TRANSACTIONS_URL = `https://api.helius.xyz/v0/transactions?api-key=${HELIUS_API_KEY}`;
export const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6';
export const JUPITER_PRICE_API = 'https://price.jup.ag/v4';

export const SECURE_STORE_KEYS = {
  MNEMONIC: 'discifi_mnemonic_encrypted',
  HOT_PUBKEY: 'discifi_hot_pubkey',
  VAULT_PUBKEY: 'discifi_vault_pubkey',
  SELECTED_NETWORK: 'discifi_selected_network',
  RULES: 'discifi_rules',
  DAILY_SPENT: 'discifi_daily_spent',
  SEEN_ADDRESSES: 'discifi_seen_addresses',
  TX_TIMESTAMPS: 'discifi_tx_timestamps',
} as const;

export const KNOWN_TOKENS: Record<string, { symbol: string; name: string; decimals: number }> = {
  'So11111111111111111111111111111111111111112': { symbol: 'SOL', name: 'Solana', decimals: 9 },
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', name: 'Tether', decimals: 6 },
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': { symbol: 'JUP', name: 'Jupiter', decimals: 6 },
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { symbol: 'BONK', name: 'Bonk', decimals: 5 },
};

export const NETWORK_LABELS: Record<string, string> = {
  mainnet: 'Solana Mainnet',
  devnet: 'Solana Devnet',
  testnet: 'Solana Testnet',
};

export const NETWORK_COLORS: Record<string, string> = {
  mainnet: '#30D158',
  devnet: '#FFD60A',
  testnet: '#FF9F0A',
};
