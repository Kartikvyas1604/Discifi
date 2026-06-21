import type { Connection, PublicKey } from '@solana/web3.js';
import type { ParsedTransaction } from './types';

export interface HeliusTx {
  signature: string;
  type: string;
  source: string;
  fee: number;
  timestamp: number;
  description: string;
  nativeTransfers?: { fromUserAccount: string; toUserAccount: string; amount: number }[];
  tokenTransfers?: { fromUserAccount: string; toUserAccount: string; mint: string; rawTokenAmount: { tokenAmount: string } }[];
  accountData?: { account: string; nativeBalanceChange: number }[];
  status: 'confirmed' | 'pending' | 'failed';
}

function parseRelativeTime(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'Yesterday';
  const d = new Date(timestamp * 1000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getTxType(heliusType: string): ParsedTransaction['type'] {
  switch (heliusType) {
    case 'SWAP': return 'swap';
    case 'TRANSFER': return 'send';
    case 'NFT_SALE': return 'swap';
    case 'NFT_BID': return 'send';
    case 'DEPOSIT': return 'receive';
    case 'WITHDRAW': return 'send';
    case 'BURN': return 'send';
    case 'CREATE': return 'approve';
    case 'APPROVE': return 'approve';
    default: return 'send';
  }
}

function formatProtocol(source: string): string {
  const protoMap: Record<string, string> = {
    JUPITER: 'Jupiter',
    JUP: 'Jupiter',
    MAGIC_EDEN: 'Magic Eden',
    ME: 'Magic Eden',
    ORCA: 'Orca',
    RAYDIUM: 'Raydium',
    KAMINO: 'Kamino',
    SOLEND: 'Solend',
    DRIFT: 'Drift',
    METEORA: 'Meteora',
    SANCTUM: 'Sanctum',
    SYSTEM_PROGRAM: 'Solana',
    TOKEN_PROGRAM: 'Solana',
    UNKNOWN: 'Solana',
  };
  return protoMap[source] || source || 'Solana';
}

function getTxAmount(tx: HeliusTx, ourAddress: string): { amount: number; token: string; usdValue: number } {
  if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
    const transfer = tx.tokenTransfers[0];
    const amount = parseFloat(transfer.rawTokenAmount.tokenAmount) / 1e9;
    const tokenSymbol = transfer.mint.slice(0, 4);
    const isReceive = transfer.toUserAccount === ourAddress;
    return { amount: isReceive ? amount : -amount, token: tokenSymbol, usdValue: 0 };
  }
  if (tx.nativeTransfers && tx.nativeTransfers.length > 0) {
    const transfer = tx.nativeTransfers[0];
    const amount = transfer.amount / 1e9;
    const isReceive = transfer.toUserAccount === ourAddress;
    return { amount: isReceive ? amount : -amount, token: 'SOL', usdValue: 0 };
  }
  return { amount: 0, token: 'SOL', usdValue: 0 };
}

export async function fetchTransactionHistory(
  connection: Connection,
  publicKey: PublicKey,
  heliusUrl: string,
): Promise<ParsedTransaction[]> {
  try {
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 20 });
    if (signatures.length === 0) return [];

    const sigs = signatures.map(s => s.signature);
    const response = await fetch(heliusUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions: sigs }),
    });

    if (!response.ok) {
      return signatures.map((sig, i): ParsedTransaction => ({
        signature: sig.signature,
        type: 'send',
        protocol: 'Solana',
        amount: 0,
        token: 'SOL',
        usdValue: 0,
        timestamp: sig.blockTime || Math.floor(Date.now() / 1000) - i * 3600,
        date: sig.blockTime ? parseRelativeTime(sig.blockTime) : 'Recently',
        status: sig.confirmationStatus === 'finalized' ? 'confirmed' : sig.confirmationStatus === 'processed' ? 'pending' : 'failed',
        fee: 0,
        source: 'Solana',
        description: `Transaction ${sig.signature.slice(0, 8)}...`,
      }));
    }

    const heliusTxs: HeliusTx[] = await response.json();
    const ourAddr = publicKey.toBase58();

    return heliusTxs.map(htx => {
      const type = getTxType(htx.type);
      const { amount, token } = getTxAmount(htx, ourAddr);
      const isReceive = type === 'receive' || (htx.tokenTransfers?.[0]?.toUserAccount === ourAddr);
      const displayType: ParsedTransaction['type'] = isReceive && type === 'send' ? 'receive' : type;

      return {
        signature: htx.signature,
        type: displayType,
        protocol: formatProtocol(htx.source),
        amount: Math.abs(amount),
        token,
        usdValue: 0,
        timestamp: htx.timestamp,
        date: parseRelativeTime(htx.timestamp),
        status: htx.status || 'confirmed',
        fee: htx.fee || 0,
        source: htx.source || '',
        description: htx.description || `${displayType} ${Math.abs(amount)} ${token}`,
        fromAddress: htx.tokenTransfers?.[0]?.fromUserAccount || htx.nativeTransfers?.[0]?.fromUserAccount,
        toAddress: htx.tokenTransfers?.[0]?.toUserAccount || htx.nativeTransfers?.[0]?.toUserAccount,
      };
    });
  } catch {
    return [];
  }
}
