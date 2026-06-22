import type { WalletSet } from '../crypto/types';

export type Network = 'mainnet' | 'devnet' | 'testnet';

export interface TokenBalance {
  mint: string;
  symbol: string;
  name: string;
  logo?: string;
  balance: number;
  decimals: number;
  usdValue: number;
  priceUsd: number;
  change24h?: number;
}

export interface WalletData {
  solBalance: number;
  solUsdValue: number;
  tokens: TokenBalance[];
  totalUsdValue: number;
  change24h: number;
  lastUpdated: Date;
  loading: boolean;
  error?: string;
}

export interface ParsedTransaction {
  signature: string;
  type: 'send' | 'receive' | 'swap' | 'approve';
  protocol: string;
  protocolLogo?: string;
  amount: number;
  token: string;
  tokenMint?: string;
  usdValue: number;
  timestamp: number;
  date: string;
  status: 'confirmed' | 'pending' | 'failed';
  fee: number;
  source: string;
  description: string;
  fromAddress?: string;
  toAddress?: string;
}

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  route: string[];
  minimumOutput: number;
  slippageBps: number;
  rawQuote: any;
}

export interface SendResult {
  signature: string;
  fee: number;
}

export interface RuleConfig {
  dailyLimit: number;
  perTxLimit: number;
  quarantineLimit: number;
  autoSavePct: number;
  velocityLimit: number;
  slippageBps: number;
}

export const DEFAULT_RULES: RuleConfig = {
  dailyLimit: 800,
  perTxLimit: 250,
  quarantineLimit: 50,
  autoSavePct: 15,
  velocityLimit: 10,
  slippageBps: 150,
};

export interface StoredWallet {
  mnemonic: string;
  hotAddress: string;
  vaultAddress: string;
}

export type { WalletSet };
