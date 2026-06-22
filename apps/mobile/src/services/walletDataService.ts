import { PublicKey, type Connection } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { JUPITER_PRICE_API, KNOWN_TOKENS } from './constants';
import type { TokenBalance, WalletData } from './types';

const WSOL_MINT = 'So11111111111111111111111111111111111111112';

export async function fetchSOLBalance(connection: Connection, publicKey: PublicKey): Promise<number> {
  const lamports = await connection.getBalance(publicKey);
  return lamports / 1e9;
}

export interface ParsedTokenAccount {
  mint: string;
  balance: number;
  decimals: number;
}

export async function fetchTokenAccounts(connection: Connection, publicKey: PublicKey): Promise<ParsedTokenAccount[]> {
  try {
    const response = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    });
    return response.value
      .filter(({ account }) => {
        const info = account.data.parsed.info;
        const balance = parseFloat(info.tokenAmount.amount);
        return balance > 0;
      })
      .map(({ account }) => {
        const info = account.data.parsed.info;
        return {
          mint: info.mint,
          balance: parseFloat(info.tokenAmount.amount) / Math.pow(10, info.tokenAmount.decimals),
          decimals: info.tokenAmount.decimals,
        };
      });
  } catch {
    return [];
  }
}

export interface PriceMap {
  [mint: string]: { price: number };
}

export async function fetchTokenPrices(mints: string[]): Promise<PriceMap> {
  if (mints.length === 0) return {};
  try {
    const ids = [...new Set(mints)].join(',');
    const url = `${JUPITER_PRICE_API}/price?ids=${ids}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.data || {};
  } catch {
    const prices: PriceMap = {};
    for (const mint of mints) {
      prices[mint] = { price: 0 };
    }
    return prices;
  }
}

export function enrichTokens(
  solBalance: number,
  solPrice: number,
  tokenAccounts: ParsedTokenAccount[],
  priceMap: PriceMap,
): TokenBalance[] {
  const tokens: TokenBalance[] = [];

  const known = KNOWN_TOKENS[WSOL_MINT];
  const solUsdValue = solBalance * solPrice;
  tokens.push({
    mint: WSOL_MINT,
    symbol: 'SOL',
    name: 'Solana',
    balance: solBalance,
    decimals: 9,
    usdValue: solUsdValue,
    priceUsd: solPrice,
  });

  for (const ta of tokenAccounts) {
    const knownToken = KNOWN_TOKENS[ta.mint] || { symbol: ta.mint.slice(0, 4), name: 'Unknown Token', decimals: ta.decimals };
    const price = priceMap[ta.mint]?.price || 0;
    const usdValue = ta.balance * price;
    tokens.push({
      mint: ta.mint,
      symbol: knownToken.symbol,
      name: knownToken.name,
      balance: ta.balance,
      decimals: knownToken.decimals,
      usdValue,
      priceUsd: price,
    });
  }

  return tokens.sort((a, b) => b.usdValue - a.usdValue);
}

export async function fetchWalletData(connection: Connection, publicKey: PublicKey): Promise<WalletData> {
  const [solBalance, tokenAccounts] = await Promise.all([
    fetchSOLBalance(connection, publicKey),
    fetchTokenAccounts(connection, publicKey),
  ]);

  const allMints = [WSOL_MINT, ...tokenAccounts.map(t => t.mint)];
  const priceMap = await fetchTokenPrices(allMints);

  const solPrice = priceMap[WSOL_MINT]?.price || 0;
  const tokens = enrichTokens(solBalance, solPrice, tokenAccounts, priceMap);
  const totalUsdValue = tokens.reduce((sum, t) => sum + t.usdValue, 0);

  return {
    solBalance,
    solUsdValue: solBalance * solPrice,
    tokens,
    totalUsdValue,
    change24h: 0,
    lastUpdated: new Date(),
    loading: false,
  };
}
