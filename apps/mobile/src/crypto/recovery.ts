import { deriveWalletSet, validateAddress } from './address';
import { mnemonicToSeed } from './bip39';
import type { WalletSet } from './types';

export interface OnChainAccount {
  pubkey: string;
  lamports: number;
  owner: string;
  data?: string;
}

export interface RecoveredState {
  wallets: WalletSet;
  accounts: OnChainAccount[];
  timestamp: number;
}

export async function queryOnChainAccounts(
  addresses: string[],
  rpcUrl: string,
): Promise<Map<string, OnChainAccount[]>> {
  const result = new Map<string, OnChainAccount[]>();
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getMultipleAccounts',
        params: [addresses, { encoding: 'base64' }],
      }),
    });
    const json = await response.json();
    if (json.result?.value) {
      for (let i = 0; i < addresses.length; i++) {
        const addr = addresses[i];
        const account = json.result.value[i];
        if (account) {
          result.set(addr, [{
            pubkey: addr,
            lamports: account.lamports,
            owner: account.owner,
            data: account.data?.[0],
          }]);
        }
      }
    }
  } catch {}
  return result;
}

export async function recoverFromSeedPhrase(
  mnemonic: string[],
  seed: Uint8Array,
  rpcUrl: string,
): Promise<RecoveredState> {
  const wallets = deriveWalletSet(seed);
  const addresses = [
    wallets.hot.address,
    wallets.vault.address,
    wallets.dao.address,
    wallets.stealthSpend.address,
    wallets.stealthView.address,
  ];
  for (const addr of addresses) {
    if (!validateAddress(addr)) {
      throw new Error(`Invalid derived address: ${addr}`);
    }
  }
  const accountsMap = await queryOnChainAccounts(addresses, rpcUrl);
  const accounts: OnChainAccount[] = [];
  for (const addr of addresses) {
    const found = accountsMap.get(addr);
    if (found) accounts.push(...found);
  }
  return { wallets, accounts, timestamp: Date.now() };
}

export async function verifyRestoration(mnemonic: string[], expectedAddress: string): Promise<boolean> {
  try {
    const seed = await mnemonicToSeed(mnemonic, '');
    const wallets = deriveWalletSet(seed);
    return wallets.hot.address === expectedAddress;
  } catch {
    return false;
  }
}
