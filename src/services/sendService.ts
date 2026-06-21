import { PublicKey, Transaction, SystemProgram, type Connection, type Keypair } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferCheckedInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import type { SendResult } from './types';

export interface SendSOLParams {
  connection: Connection;
  sender: Keypair;
  recipient: string;
  amountLamports: number;
}

export interface SendSPLParams {
  connection: Connection;
  sender: Keypair;
  recipient: string;
  mint: string;
  amount: number;
  decimals: number;
}

export async function sendSOL({ connection, sender, recipient, amountLamports }: SendSOLParams): Promise<SendResult> {
  const recipientPubkey = new PublicKey(recipient);
  const senderPubkey = sender.publicKey;

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

  const ix = SystemProgram.transfer({
    fromPubkey: senderPubkey,
    toPubkey: recipientPubkey,
    lamports: amountLamports,
  });

  const tx = new Transaction().add(ix);
  tx.feePayer = senderPubkey;
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;

  tx.sign(sender);
  const signature = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });

  const result = await pollSignature(connection, signature);
  if (!result) throw new Error('Transaction timed out. The network may be congested. Please try again.');

  return { signature, fee: 0 };
}

export async function sendSPL({ connection, sender, recipient, mint, amount, decimals }: SendSPLParams): Promise<SendResult> {
  const recipientPubkey = new PublicKey(recipient);
  const mintPubkey = new PublicKey(mint);
  const senderPubkey = sender.publicKey;

  const senderAta = await getAssociatedTokenAddress(mintPubkey, senderPubkey);
  const recipientAta = await getAssociatedTokenAddress(mintPubkey, recipientPubkey);

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

  const tx = new Transaction();
  tx.feePayer = senderPubkey;
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;

  const recipientAtaInfo = await connection.getAccountInfo(recipientAta).catch(() => null);
  if (!recipientAtaInfo) {
    const { createAssociatedTokenAccountInstruction } = await import('@solana/spl-token');
    tx.add(
      createAssociatedTokenAccountInstruction(
        senderPubkey,
        recipientAta,
        recipientPubkey,
        mintPubkey,
      ),
    );
  }

  const transferAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)));
  tx.add(
    createTransferCheckedInstruction(
      senderAta,
      mintPubkey,
      recipientAta,
      senderPubkey,
      transferAmount,
      decimals,
      [],
      TOKEN_PROGRAM_ID,
    ),
  );

  tx.sign(sender);
  const signature = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });

  const result = await pollSignature(connection, signature);
  if (!result) throw new Error('Transaction timed out. The network may be congested. Please try again.');

  return { signature, fee: 0 };
}

export function validateAddress(address: string): boolean {
  try {
    const pubkey = new PublicKey(address);
    return PublicKey.isOnCurve(pubkey.toBytes());
  } catch {
    return false;
  }
}

export function truncateAddress(address: string): string {
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

async function pollSignature(connection: Connection, signature: string, maxRetries = 30): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    const status = await connection.getSignatureStatus(signature, { searchTransactionHistory: true });
    if (status?.value?.confirmationStatus === 'confirmed' || status?.value?.confirmationStatus === 'finalized') {
      return true;
    }
    if (status?.value?.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  return false;
}
