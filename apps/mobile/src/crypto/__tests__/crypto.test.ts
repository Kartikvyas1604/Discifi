import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as bip39 from '../bip39';
import * as slip10 from '../slip10';
import * as address from '../address';
import * as entropy from '../entropy';
import * as hardwareCard from '../hardwareCard';
import { WalletManager } from '../WalletManager';
import { signTransaction, verifySignature, signWithPath } from '../signing';
import { createMultisigTransaction, addSignature, isFullySigned } from '../multisig';

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(b: Uint8Array): string {
  return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
}

const BIP39_VECTORS: { entropy: string; mnemonic: string; seed: string; passphrase: string }[] = [
  {
    entropy: '00000000000000000000000000000000',
    mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    seed: 'c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e53495531f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04',
    passphrase: 'TREZOR',
  },
  {
    entropy: '7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f',
    mnemonic: 'legal winner thank year wave sausage worth useful legal winner thank yellow',
    seed: '2e8905819b8723fe2c1d161860e5ee1830318dbf49a83bd451cfb8440c28bd6fa457fe1296106559a3c80937a1c1069be3a3a5bd381ee6260e8d9739fce1f607',
    passphrase: 'TREZOR',
  },
  {
    entropy: 'ffffffffffffffffffffffffffffffff',
    mnemonic: 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong',
    seed: 'ac27495480225222079d7be181583751e86f571027b0497b5b5d11218e0a8a13332572917f0f8e5a589620c6f15b11c61dee327651a14c34e18231052e48c069',
    passphrase: 'TREZOR',
  },
  {
    entropy: '0000000000000000000000000000000000000000000000000000000000000000',
    mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art',
    seed: 'bda85446c68413707090a52022edd26a1c9462295029f2e60cd7c4f2bbd3097170af7a4d73245cafa9c3cca8d561a7c3de6f5d4a10be8ed2a5e608d68f92fcc8',
    passphrase: 'TREZOR',
  },
  {
    entropy: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    mnemonic: 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo vote',
    seed: 'dd48c104698c30cfe2b6142103248622fb7bb0ff692eebb00089b32d22484e1613912f0a5b694407be899ffd31ed3992c456cdf60f5d4564b8ba3f05a69890ad',
    passphrase: 'TREZOR',
  },
];

describe('BIP39', () => {
  it('entropyToMnemonic matches test vectors', () => {
    for (const v of BIP39_VECTORS) {
      const entropyHex = hexToBytes(v.entropy);
      const mnemonic = bip39.entropyToMnemonic(entropyHex);
      assert.equal(mnemonic.join(' '), v.mnemonic);
    }
  });

  it('mnemonicToSeed matches test vectors with passphrase', async () => {
    for (const v of BIP39_VECTORS) {
      const words = v.mnemonic.split(' ');
      const seed = await bip39.mnemonicToSeed(words, v.passphrase);
      assert.equal(bytesToHex(seed), v.seed);
    }
  });

  it('mnemonicToSeed produces 64 bytes', async () => {
    for (const v of BIP39_VECTORS) {
      const words = v.mnemonic.split(' ');
      const seed = await bip39.mnemonicToSeed(words, v.passphrase);
      assert.equal(seed.length, 64);
    }
  });

  it('validateMnemonic returns { valid: true } for valid phrases', () => {
    for (const v of BIP39_VECTORS) {
      const words = v.mnemonic.split(' ');
      const result = bip39.validateMnemonic(words);
      assert.ok(result.valid);
    }
  });

  it('validateMnemonic returns { valid: false } for invalid word', () => {
    const bad = ['abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'notaword', 'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'about'];
    const result = bip39.validateMnemonic(bad);
    assert.equal(result.valid, false);
    assert.ok(result.error?.includes('notaword'));
  });

  it('validateMnemonic returns { valid: false } for wrong checksum', () => {
    const words = BIP39_VECTORS[0].mnemonic.split(' ');
    words[words.length - 1] = 'zoo';
    const result = bip39.validateMnemonic(words);
    assert.equal(result.valid, false);
    assert.ok(result.error?.includes('Checksum'));
  });

  it('validateMnemonic rejects wrong word counts', () => {
    const words = ['abandon', 'abandon'];
    const result = bip39.validateMnemonic(words);
    assert.equal(result.valid, false);
    assert.ok(result.error?.includes('word count'));
  });

  it('generateMnemonic(256) produces valid 24-word phrase', async () => {
    const result = await bip39.generateMnemonic(256);
    assert.equal(result.mnemonic.length, 24);
    const validation = bip39.validateMnemonic(result.mnemonic);
    assert.ok(validation.valid);
    assert.equal(result.entropy.length, 32);
  });

  it('generateMnemonic(128) produces valid 12-word phrase', async () => {
    const result = await bip39.generateMnemonic(128);
    assert.equal(result.mnemonic.length, 12);
    const validation = bip39.validateMnemonic(result.mnemonic);
    assert.ok(validation.valid);
    assert.equal(result.entropy.length, 16);
  });

  it('clearBytes zeroes array', () => {
    const arr = new Uint8Array([1, 2, 3, 4, 5]);
    bip39.clearBytes(arr);
    assert.ok(arr.every(b => b === 0));
  });

  it('mnemonicToEntropy roundtrip matches all vectors', () => {
    for (const v of BIP39_VECTORS) {
      const entropyHex = hexToBytes(v.entropy);
      const words = bip39.entropyToMnemonic(entropyHex);
      const recovered = bip39.mnemonicToEntropy(words);
      assert.deepEqual(recovered, entropyHex);
    }
  });

  it('mnemonicToEntropy roundtrip for generated 24-word', async () => {
    const result = await bip39.generateMnemonic(256);
    const recovered = bip39.mnemonicToEntropy(result.mnemonic);
    assert.deepEqual(recovered, result.entropy);
  });

  it('generateMnemonicFromEntropy produces matching mnemonic', () => {
    const entropyHex = hexToBytes(BIP39_VECTORS[0].entropy);
    const mnemonic = bip39.generateMnemonicFromEntropy(entropyHex);
    assert.equal(mnemonic.join(' '), BIP39_VECTORS[0].mnemonic);
  });

  it('generateMnemonicFromEntropy rejects wrong entropy length', () => {
    assert.throws(() => bip39.generateMnemonicFromEntropy(new Uint8Array(8)));
    assert.throws(() => bip39.generateMnemonicFromEntropy(new Uint8Array(24)));
  });
});

describe('SLIP10 Ed25519', () => {
  const SEED_HEX = '000102030405060708090a0b0c0d0e0f';
  const MASTER_KEY_HEX = '2b4be7f19ee27bbf30c667b642d5f4aa69fd169872f8fc3059c08ebae2eb19e7';
  const MASTER_CHAIN_HEX = '90046a93de5380a72b5e45010748567d5ea02bbf6522f979e05c0d8d8ca9fffb';
  const CHILD_0_KEY_HEX = '68e0fe46dfb67e368c75379acec591dad19df3cde26e63b93a8e704f1dade7a3';
  const CHILD_0_CHAIN_HEX = '8b59aa11380b624e81507a27fedda59fea6d0b779a778918a2fd3590e16e9c69';

  const SEED_2_HEX = 'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542';
  const MASTER_2_KEY_HEX = '171cb88b1b3c1db25add599712e36245d75bc65a1a5c9e18d76f9f2b1eab4012';
  const MASTER_2_CHAIN_HEX = 'ef70a74db9c3a5af931b5fe73ed8e1a53464133654fd55e7a66f8570b8e33c3b';
  const CHILD_2_0_KEY_HEX = '1559eb2bbec5790b0c65d8693e4d0875b1747f4970ae8b650486ed7470845635';
  const CHILD_2_0_CHAIN_HEX = '0b78a3226f915c082bf118f83618a618ab6dec793752624cbeb622acb562862d';

  it('deriveMasterKey matches test vector 1', () => {
    const seed = hexToBytes(SEED_HEX);
    const { key, chainCode } = slip10.deriveMasterKey(seed);
    assert.equal(bytesToHex(key), MASTER_KEY_HEX);
    assert.equal(bytesToHex(chainCode), MASTER_CHAIN_HEX);
  });

  it('deriveMasterKey matches test vector 2 (long seed)', () => {
    const seed = hexToBytes(SEED_2_HEX);
    const { key, chainCode } = slip10.deriveMasterKey(seed);
    assert.equal(bytesToHex(key), MASTER_2_KEY_HEX);
    assert.equal(bytesToHex(chainCode), MASTER_2_CHAIN_HEX);
  });

  it('deriveChildKey m/0\' matches test vector 1', () => {
    const seed = hexToBytes(SEED_HEX);
    const { key: masterKey, chainCode: masterChain } = slip10.deriveMasterKey(seed);
    const { key, chainCode } = slip10.deriveChildKey(masterKey, masterChain, 0);
    assert.equal(bytesToHex(key), CHILD_0_KEY_HEX);
    assert.equal(bytesToHex(chainCode), CHILD_0_CHAIN_HEX);
  });

  it('deriveChildKey m/0\' matches test vector 2', () => {
    const seed = hexToBytes(SEED_2_HEX);
    const { key: masterKey, chainCode: masterChain } = slip10.deriveMasterKey(seed);
    const { key, chainCode } = slip10.deriveChildKey(masterKey, masterChain, 0);
    assert.equal(bytesToHex(key), CHILD_2_0_KEY_HEX);
    assert.equal(bytesToHex(chainCode), CHILD_2_0_CHAIN_HEX);
  });

  it('derivePath m/0\' matches test vector', () => {
    const seed = hexToBytes(SEED_HEX);
    const { key, chainCode } = slip10.derivePath(seed, "m/0'");
    assert.equal(bytesToHex(key), CHILD_0_KEY_HEX);
    assert.equal(bytesToHex(chainCode), CHILD_0_CHAIN_HEX);
  });

  it('derivePath m returns master key', () => {
    const seed = hexToBytes(SEED_HEX);
    const { key, chainCode } = slip10.derivePath(seed, 'm');
    assert.equal(bytesToHex(key), MASTER_KEY_HEX);
    assert.equal(bytesToHex(chainCode), MASTER_CHAIN_HEX);
  });

  it('parseDerivationPath handles various formats', () => {
    assert.deepEqual(slip10.parseDerivationPath('m'), []);
    assert.deepEqual(slip10.parseDerivationPath("m/0'"), [0x80000000]);
    assert.deepEqual(slip10.parseDerivationPath("m/44'/501'/0'/0'"), [
      0x8000002c, 0x800001f5, 0x80000000, 0x80000000,
    ]);
    assert.deepEqual(slip10.parseDerivationPath('m/44h/501h/0h/0h'), [
      0x8000002c, 0x800001f5, 0x80000000, 0x80000000,
    ]);
  });

  it('parseDerivationPath throws for invalid paths', () => {
    assert.throws(() => slip10.parseDerivationPath('x/0'));
    assert.throws(() => slip10.parseDerivationPath('m/-1'));
    assert.throws(() => slip10.parseDerivationPath('m/abc'));
  });

  it('isValidEd25519PrivateKey accepts valid key', () => {
    const key = hexToBytes(MASTER_KEY_HEX);
    assert.ok(slip10.isValidEd25519PrivateKey(key));
  });

  it('derivePath matches Solana BIP44 path', () => {
    const seed = hexToBytes(SEED_HEX);
    const { key } = slip10.derivePath(seed, "m/44'/501'/0'/0'");
    assert.equal(key.length, 32);
  });

  it('derivePath produces different keys for different paths', () => {
    const seed = hexToBytes(SEED_HEX);
    const { key: k1 } = slip10.derivePath(seed, "m/44'/501'/0'/0'");
    const { key: k2 } = slip10.derivePath(seed, "m/44'/501'/1'/0'");
    assert.notEqual(bytesToHex(k1), bytesToHex(k2));
  });

  it('getPublicKey produces 32 bytes', () => {
    const seed = hexToBytes(SEED_HEX);
    const { key } = slip10.derivePath(seed, "m/44'/501'/0'/0'");
    const pubkey = slip10.getPublicKey(key);
    assert.equal(pubkey.length, 32);
  });

  it('getPublicKey produces consistent results', () => {
    const seed = hexToBytes(SEED_HEX);
    const { key } = slip10.derivePath(seed, "m/44'/501'/0'/0'");
    const pk1 = slip10.getPublicKey(key);
    const pk2 = slip10.getPublicKey(key);
    assert.deepEqual(pk1, pk2);
  });
});

describe('Address', () => {
  it('publicKeyToAddress produces valid base58', () => {
    const pubkey = new Uint8Array(32);
    for (let i = 0; i < 32; i++) pubkey[i] = i;
    const addr = address.publicKeyToAddress(pubkey);
    assert.ok(typeof addr === 'string');
    assert.ok(addr.length >= 32 && addr.length <= 44);
    assert.ok(address.validateAddress(addr));
  });

  it('publicKeyToAddress throws on wrong length', () => {
    assert.throws(() => address.publicKeyToAddress(new Uint8Array(16)));
    assert.throws(() => address.publicKeyToAddress(new Uint8Array(64)));
  });

  it('validateAddress rejects invalid', () => {
    assert.equal(address.validateAddress('not-a-base58'), false);
    assert.equal(address.validateAddress('1'), false);
    assert.equal(address.validateAddress(''), false);
  });

  it('validateAddress accepts valid Solana address', () => {
    const pubkey = new Uint8Array(32);
    const addr = address.publicKeyToAddress(pubkey);
    assert.ok(address.validateAddress(addr));
  });

  it('deriveKeypair produces consistent results', () => {
    const seed = hexToBytes('000102030405060708090a0b0c0d0e0f');
    const kp1 = address.deriveKeypair(seed, "m/44'/501'/0'/0'");
    const kp2 = address.deriveKeypair(seed, "m/44'/501'/0'/0'");
    assert.equal(kp1.address, kp2.address);
    assert.deepEqual(kp1.privateKey, kp2.privateKey);
    assert.deepEqual(kp1.publicKey, kp2.publicKey);
  });

  it('deriveKeypair produces different wallets for different accounts', () => {
    const seed = hexToBytes('000102030405060708090a0b0c0d0e0f');
    const acc0 = address.deriveAccount(seed, 0);
    const acc1 = address.deriveAccount(seed, 1);
    assert.notEqual(acc0.address, acc1.address);
  });

  it('deriveWalletSet returns all 5 wallets with distinct addresses', () => {
    const seed = hexToBytes('000102030405060708090a0b0c0d0e0f');
    const wallets = address.deriveWalletSet(seed);
    assert.ok(wallets.hot.address);
    assert.ok(wallets.vault.address);
    assert.ok(wallets.dao.address);
    assert.ok(wallets.stealthSpend.address);
    assert.ok(wallets.stealthView.address);
    const addresses = [
      wallets.hot.address,
      wallets.vault.address,
      wallets.dao.address,
      wallets.stealthSpend.address,
      wallets.stealthView.address,
    ];
    assert.equal(new Set(addresses).size, 5);
  });

  it('deriveWalletSet addresses are valid Solana addresses', () => {
    const seed = hexToBytes('000102030405060708090a0b0c0d0e0f');
    const wallets = address.deriveWalletSet(seed);
    for (const kp of [wallets.hot, wallets.vault, wallets.dao, wallets.stealthSpend, wallets.stealthView]) {
      assert.ok(address.validateAddress(kp.address), `Invalid address: ${kp.address}`);
    }
  });

  it('deterministic from mnemonic', async () => {
    const result = await bip39.generateMnemonic(128);
    const seed = await bip39.mnemonicToSeed(result.mnemonic, '');
    const wallets1 = address.deriveWalletSet(seed);
    const wallets2 = address.deriveWalletSet(seed);
    assert.equal(wallets1.hot.address, wallets2.hot.address);
    assert.equal(wallets1.vault.address, wallets2.vault.address);
  });
});

describe('Roundtrip: mnemonic → seed → wallets → restore', () => {
  it('generates, derives, restores identical addresses', async () => {
    const { mnemonic } = await bip39.generateMnemonic(256);
    const seed = await bip39.mnemonicToSeed(mnemonic, '');
    const wallets = address.deriveWalletSet(seed);
    const restoredSeed = await bip39.mnemonicToSeed(mnemonic, '');
    const restored = address.deriveWalletSet(restoredSeed);
    assert.equal(wallets.hot.address, restored.hot.address);
    assert.equal(wallets.vault.address, restored.vault.address);
    assert.equal(wallets.dao.address, restored.dao.address);
    assert.equal(wallets.stealthSpend.address, restored.stealthSpend.address);
    assert.equal(wallets.stealthView.address, restored.stealthView.address);
  });

  it('passphrase changes derived addresses', async () => {
    const { mnemonic } = await bip39.generateMnemonic(128);
    const seed1 = await bip39.mnemonicToSeed(mnemonic, '');
    const seed2 = await bip39.mnemonicToSeed(mnemonic, 'different');
    const w1 = address.deriveWalletSet(seed1);
    const w2 = address.deriveWalletSet(seed2);
    assert.notEqual(w1.hot.address, w2.hot.address);
  });

  it('same passphrase produces same addresses', async () => {
    const { mnemonic } = await bip39.generateMnemonic(128);
    const seed1 = await bip39.mnemonicToSeed(mnemonic, 'test-pass');
    const seed2 = await bip39.mnemonicToSeed(mnemonic, 'test-pass');
    const w1 = address.deriveWalletSet(seed1);
    const w2 = address.deriveWalletSet(seed2);
    assert.equal(w1.hot.address, w2.hot.address);
  });

  it('deriveAccount produces incrementing wallets', () => {
    const seed = hexToBytes('000102030405060708090a0b0c0d0e0f');
    const addresses = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const kp = address.deriveAccount(seed, i);
      assert.ok(address.validateAddress(kp.address));
      addresses.add(kp.address);
    }
    assert.equal(addresses.size, 10);
  });
});

describe('WalletManager', () => {
  it('createWallet generates valid mnemonic', async () => {
    const wm = new WalletManager();
    const result = await wm.createWallet({ strength: 256 });
    assert.equal(result.mnemonic.length, 24);
    const validation = bip39.validateMnemonic(result.mnemonic);
    assert.ok(validation.valid);
  });

  it('deriveFromMnemonic produces WalletSet', async () => {
    const wm = new WalletManager();
    await wm.createWallet({ strength: 128 });
    const wallets = await wm.deriveFromMnemonic('');
    assert.ok(wallets.hot.address);
    assert.ok(wallets.vault.address);
  });

  it('restoreWallet validates mnemonic', () => {
    const wm = new WalletManager();
    const words = ['abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'about'];
    const result = wm.restoreWallet(words);
    assert.ok(result.valid);
  });

  it('restoreWallet rejects invalid mnemonic', () => {
    const wm = new WalletManager();
    const words = ['not', 'a', 'valid', 'phrase'];
    const result = wm.restoreWallet(words);
    assert.equal(result.valid, false);
  });

  it('clearSensitiveData clears references', async () => {
    const wm = new WalletManager();
    await wm.createWallet({ strength: 128 });
    await wm.deriveFromMnemonic('');
    wm.clearSensitiveData();
    assert.equal(wm.getMnemonic(), null);
    assert.equal(wm.getWallets(), null);
  });
});

describe('Entropy', () => {
  it('mixEntropy XORs bytes correctly', () => {
    const a = new Uint8Array([0xff, 0x00, 0xaa]);
    const b = new Uint8Array([0x00, 0xff, 0x55]);
    const mixed = entropy.mixEntropy(a, b);
    assert.deepEqual(mixed, new Uint8Array([0xff, 0xff, 0xff]));
  });

  it('mixEntropy throws on length mismatch', () => {
    assert.throws(() => entropy.mixEntropy(new Uint8Array(2), new Uint8Array(4)));
  });

  it('collectMotionEntropy produces buffer of correct length', () => {
    const result = entropy.collectMotionEntropy(16);
    assert.equal(result.length, 16);
  });
});

describe('Hardware Card', () => {
  it('generateCardKeypair produces keypair', () => {
    const kp = hardwareCard.generateCardKeypair();
    assert.equal(kp.publicKey.length, 32);
    assert.equal(kp.secretKey.length, 32);
  });

  it('encryptForCard and decryptWithCard roundtrip', () => {
    const card = hardwareCard.generateCardKeypair();
    const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
    const encrypted = hardwareCard.encryptForCard(plaintext, card.publicKey);
    const decrypted = hardwareCard.decryptWithCard(encrypted, card.secretKey);
    assert.deepEqual(decrypted, plaintext);
  });

  it('cardFingerprint produces readable id', () => {
    const kp = hardwareCard.generateCardKeypair();
    const fp = hardwareCard.cardFingerprint(kp.publicKey);
    assert.ok(fp.startsWith('sentinel-'));
    assert.equal(fp.length, 25);
  });

  it('decryptWithCard fails with wrong key', () => {
    const card1 = hardwareCard.generateCardKeypair();
    const card2 = hardwareCard.generateCardKeypair();
    const plaintext = new Uint8Array([1, 2, 3]);
    const encrypted = hardwareCard.encryptForCard(plaintext, card1.publicKey);
    assert.throws(() => hardwareCard.decryptWithCard(encrypted, card2.secretKey));
  });
});

describe('Signing', () => {
  it('signTransaction produces 64-byte signature', () => {
    const seed = hexToBytes('000102030405060708090a0b0c0d0e0f');
    const { key } = slip10.derivePath(seed, "m/44'/501'/0'/0'");
    const tx = new Uint8Array([1, 2, 3, 4, 5]);
    const sig = signTransaction(tx, key);
    assert.equal(sig.length, 64);
  });

  it('verifySignature validates correctly', () => {
    const seed = hexToBytes('000102030405060708090a0b0c0d0e0f');
    const { key } = slip10.derivePath(seed, "m/44'/501'/0'/0'");
    const pubkey = slip10.getPublicKey(key);
    const tx = new Uint8Array([1, 2, 3, 4, 5]);
    const sig = signTransaction(tx, key);
    assert.ok(verifySignature(tx, sig, pubkey));
    const badTx = new Uint8Array([9, 9, 9]);
    assert.equal(verifySignature(badTx, sig, pubkey), false);
  });

  it('signWithPath derives key and signs', () => {
    const seed = hexToBytes('000102030405060708090a0b0c0d0e0f');
    const tx = new Uint8Array([1, 2, 3]);
    const result = signWithPath(seed, tx, "m/44'/501'/0'/0'");
    assert.equal(result.signature.length, 64);
    assert.equal(result.publicKey.length, 32);
    assert.ok(verifySignature(tx, result.signature, result.publicKey));
  });
});

describe('Multi-Signature', () => {
  it('createMultisigTransaction creates valid partial tx', () => {
    const pubkeys = [new Uint8Array(32), new Uint8Array(32)];
    const tx = createMultisigTransaction('blockhash123', [new Uint8Array([1, 2, 3])], pubkeys);
    assert.equal(tx.requiredSigners.length, 2);
    assert.equal(tx.signatures.length, 0);
  });

  it('addSignature adds valid signature', () => {
    const seed = hexToBytes('000102030405060708090a0b0c0d0e0f');
    const { key } = slip10.derivePath(seed, "m/44'/501'/0'/0'");
    const pubkey = slip10.getPublicKey(key);
    const tx = createMultisigTransaction('bh', [new Uint8Array([1])], [pubkey]);
    const sig = signTransaction(tx.message, key);
    const signed = addSignature(tx, sig, pubkey);
    assert.equal(signed.signatures.length, 1);
  });

  it('addSignature rejects invalid signature', () => {
    const pubkey = new Uint8Array(32);
    pubkey[0] = 1;
    const tx = createMultisigTransaction('bh', [new Uint8Array([1])], [pubkey]);
    const badSig = new Uint8Array(64);
    assert.throws(() => addSignature(tx, badSig, pubkey));
  });

  it('isFullySigned reports correctly', () => {
    const pk1 = new Uint8Array(32); pk1[0] = 1;
    const pk2 = new Uint8Array(32); pk2[0] = 2;
    const tx = createMultisigTransaction('bh', [new Uint8Array([1])], [pk1, pk2]);
    assert.equal(isFullySigned(tx), false);
  });
});

describe('Deterministic from test vectors', () => {
  it('known seed produces valid addresses', () => {
    const seed = hexToBytes('000102030405060708090a0b0c0d0e0f');
    const wallets = address.deriveWalletSet(seed);
    assert.ok(address.validateAddress(wallets.hot.address));
    assert.ok(address.validateAddress(wallets.vault.address));
    assert.ok(address.validateAddress(wallets.dao.address));
    const addresses = [wallets.hot.address, wallets.vault.address, wallets.dao.address];
    assert.equal(new Set(addresses).size, 3);
  });

  it('generate 10k wallets from seed, all valid', () => {
    const seed = hexToBytes('deadbeefcafebabedeadbeefcafebabedeadbeefcafebabedeadbeefcafebabe');
    for (let i = 0; i < 10000; i++) {
      const path = `m/44'/501'/${i}'/0'`;
      const { key: childKey } = slip10.derivePath(seed, path);
      const pubkey = slip10.getPublicKey(childKey);
      const addr = address.publicKeyToAddress(pubkey);
      const valid = address.validateAddress(addr);
      if (!valid) throw new Error(`Invalid address at index ${i}: ${addr}`);
    }
  });
});
