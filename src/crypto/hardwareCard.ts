import * as nacl from 'tweetnacl';

export interface CardKeypair {
  publicKey: Uint8Array;
  deviceId: string;
}

export interface EncryptedPayload {
  ciphertext: Uint8Array;
  ephemeralPublicKey: Uint8Array;
  nonce: Uint8Array;
}

export function generateCardKeypair(): { publicKey: Uint8Array; secretKey: Uint8Array } {
  const kp = nacl.box.keyPair();
  return { publicKey: kp.publicKey, secretKey: kp.secretKey };
}

export function encryptForCard(
  plaintext: Uint8Array,
  cardPublicKey: Uint8Array,
): EncryptedPayload {
  const ephemeral = nacl.box.keyPair();
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const ciphertext = nacl.box(plaintext, nonce, cardPublicKey, ephemeral.secretKey);
  if (!ciphertext) throw new Error('Encryption failed');
  return {
    ciphertext,
    ephemeralPublicKey: ephemeral.publicKey,
    nonce,
  };
}

export function decryptWithCard(
  payload: EncryptedPayload,
  cardSecretKey: Uint8Array,
): Uint8Array {
  const plaintext = nacl.box.open(
    payload.ciphertext,
    payload.nonce,
    payload.ephemeralPublicKey,
    cardSecretKey,
  );
  if (!plaintext) throw new Error('Decryption failed — invalid card key');
  return plaintext;
}

export function cardFingerprint(publicKey: Uint8Array): string {
  const hash = nacl.hash(publicKey);
  const hex = Array.from(hash.slice(0, 8))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `sentinel-${hex}`;
}
