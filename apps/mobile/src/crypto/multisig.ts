import { signTransaction, verifySignature, serializeTransactionForSigning } from './signing';
import type { DerivedKeypair, SignatureResult } from './types';

export interface PartialSignedTx {
  message: Uint8Array;
  signatures: { publicKey: Uint8Array; signature: Uint8Array }[];
  requiredSigners: Uint8Array[];
}

export function createMultisigTransaction(
  recentBlockhash: string,
  instructions: Uint8Array[],
  requiredSigners: Uint8Array[],
): PartialSignedTx {
  const message = serializeTransactionForSigning(recentBlockhash, instructions, requiredSigners);
  return {
    message,
    signatures: [],
    requiredSigners,
  };
}

export function addSignature(
  tx: PartialSignedTx,
  signature: Uint8Array,
  publicKey: Uint8Array,
): PartialSignedTx {
  if (!verifySignature(tx.message, signature, publicKey)) {
    throw new Error('Invalid signature — transaction rejected');
  }
  const idx = tx.requiredSigners.findIndex(pk => {
    if (pk.length !== publicKey.length) return false;
    return pk.every((b, i) => b === publicKey[i]);
  });
  if (idx === -1) {
    throw new Error('Public key not in required signers set');
  }
  const existingIdx = tx.signatures.findIndex(s =>
    s.publicKey.length === publicKey.length && s.publicKey.every((b, i) => b === publicKey[i])
  );
  if (existingIdx !== -1) {
    tx.signatures[existingIdx] = { publicKey, signature };
  } else {
    tx.signatures.push({ publicKey, signature });
  }
  return tx;
}

export function isFullySigned(tx: PartialSignedTx): boolean {
  if (tx.signatures.length < tx.requiredSigners.length) return false;
  const signedPks = new Set(tx.signatures.map(s => bytesToHex(s.publicKey)));
  return tx.requiredSigners.every(pk => signedPks.has(bytesToHex(pk)));
}

function bytesToHex(b: Uint8Array): string {
  return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
}

export function serializeFullySignedTransaction(tx: PartialSignedTx): Uint8Array {
  if (!isFullySigned(tx)) {
    throw new Error('Transaction is not fully signed');
  }
  const numSigners = tx.requiredSigners.length;
  const signatureLength = 1 + numSigners * 64;
  const finalTx = new Uint8Array(signatureLength + tx.message.length);
  let offset = 0;
  finalTx[offset++] = numSigners;
  for (const signer of tx.requiredSigners) {
    const sig = tx.signatures.find(s =>
      s.publicKey.length === signer.length && s.publicKey.every((b, i) => b === signer[i])
    );
    if (!sig) throw new Error('Missing signature for required signer');
    finalTx.set(sig.signature, offset);
    offset += 64;
  }
  finalTx.set(tx.message, offset);
  return finalTx;
}
