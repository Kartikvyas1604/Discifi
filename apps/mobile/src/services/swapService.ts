import { PublicKey, Transaction, type Connection, type Keypair, type VersionedTransaction } from '@solana/web3.js';
import { JUPITER_QUOTE_API } from './constants';
import type { SwapQuote } from './types';

export interface GetQuoteParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps: number;
}

export async function getJupiterQuote(params: GetQuoteParams): Promise<SwapQuote> {
  const url = `${JUPITER_QUOTE_API}/quote?` + new URLSearchParams({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: Math.floor(params.amount).toString(),
    slippageBps: params.slippageBps.toString(),
  });

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Jupiter quote failed: ${text}`);
  }

  const data = await response.json();

  const routeProtocols: string[] = [];
  if (data.routePlan) {
    for (const step of data.routePlan) {
      if (step.swapInfo?.label) routeProtocols.push(step.swapInfo.label);
    }
  }

  const minimumOutput = Math.floor(
    data.outAmount * (1 - params.slippageBps / 10000),
  );

  return {
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    inputAmount: params.amount,
    outputAmount: parseInt(data.outAmount),
    priceImpact: data.priceImpactPct || 0,
    route: routeProtocols.length > 0 ? routeProtocols : ['Jupiter'],
    minimumOutput,
    slippageBps: params.slippageBps,
    rawQuote: data,
  };
}

export async function executeJupiterSwap(
  connection: Connection,
  wallet: Keypair,
  quoteResponse: any,
): Promise<string> {
  const swapUrl = `${JUPITER_QUOTE_API}/swap`;
  const swapResponse = await fetch(swapUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey: wallet.publicKey.toBase58(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    }),
  });

  if (!swapResponse.ok) {
    const text = await swapResponse.text();
    throw new Error(`Jupiter swap setup failed: ${text}`);
  }

  const swapData = await swapResponse.json();
  const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
  const tx = VersionedTransaction.deserialize(swapTransactionBuf);

  tx.sign([wallet]);

  const signature = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
    maxRetries: 3,
  });

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const confirmation = await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  });

  if (confirmation.value.err) {
    throw new Error(`Swap failed: ${JSON.stringify(confirmation.value.err)}`);
  }

  return signature;
}

export function getExplorerUrl(network: string, signature: string): string {
  const base = 'https://explorer.solana.com';
  if (network === 'devnet') return `${base}/tx/${signature}?cluster=devnet`;
  if (network === 'testnet') return `${base}/tx/${signature}?cluster=testnet`;
  return `${base}/tx/${signature}`;
}
