import type { Connection, PublicKey } from '@solana/web3.js';

export async function requestAirdrop(connection: Connection, publicKey: PublicKey, amount: number = 1_000_000_000): Promise<string> {
  const sig = await connection.requestAirdrop(publicKey, amount);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const result = await connection.confirmTransaction({
    signature: sig,
    blockhash,
    lastValidBlockHeight,
  });
  if (result.value.err) {
    throw new Error(`Airdrop failed: ${JSON.stringify(result.value.err)}`);
  }
  return sig;
}
