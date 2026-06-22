import * as nacl from 'tweetnacl';
import { derivePath } from './slip10';
import type { SignatureResult } from './types';

export function signTransaction(
  transactionBytes: Uint8Array,
  privateKey: Uint8Array,
): Uint8Array {
  const keypair = nacl.sign.keyPair.fromSeed(privateKey);
  return nacl.sign.detached(transactionBytes, keypair.secretKey);
}

export function verifySignature(
  transactionBytes: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array,
): boolean {
  return nacl.sign.detached.verify(transactionBytes, signature, publicKey);
}

export function signWithPath(
  seed: Uint8Array,
  transactionBytes: Uint8Array,
  path: string,
): SignatureResult {
  const { key: privateKey } = derivePath(seed, path);
  const keypair = nacl.sign.keyPair.fromSeed(privateKey);
  const signature = nacl.sign.detached(transactionBytes, keypair.secretKey);
  return { signature, publicKey: keypair.publicKey };
}

export function serializeTransactionForSigning(
  recentBlockhash: string,
  instructions: Uint8Array[],
  signerPubkeys: Uint8Array[],
): Uint8Array {
  const encoder = new TextEncoder();
  const blockhashBytes = encoder.encode(recentBlockhash);
  const totalLength = 1 + 1 + blockhashBytes.length + signerPubkeys.length * 32 + instructions.reduce((a, i) => a + i.length, 0);
  const message = new Uint8Array(totalLength);
  let offset = 0;
  message[offset++] = 0x02;
  message[offset++] = signerPubkeys.length;
  for (const pubkey of signerPubkeys) {
    message.set(pubkey, offset);
    offset += 32;
  }
  message.set(blockhashBytes, offset);
  offset += blockhashBytes.length;
  for (const ix of instructions) {
    message.set(ix, offset);
    offset += ix.length;
  }
  return message;
}
