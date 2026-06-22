import * as SecureStore from 'expo-secure-store';
import { SECURE_STORE_KEYS } from './constants';
import type { Network, RuleConfig, DEFAULT_RULES } from './types';

export async function storeMnemonic(mnemonic: string): Promise<void> {
  await SecureStore.setItemAsync(SECURE_STORE_KEYS.MNEMONIC, mnemonic);
}

export async function getMnemonic(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_STORE_KEYS.MNEMONIC);
}

export async function hasStoredWallet(): Promise<boolean> {
  const mnemonic = await getMnemonic();
  return mnemonic !== null;
}

export async function storePubKey(key: 'hot' | 'vault', address: string): Promise<void> {
  const storeKey = key === 'hot' ? SECURE_STORE_KEYS.HOT_PUBKEY : SECURE_STORE_KEYS.VAULT_PUBKEY;
  await SecureStore.setItemAsync(storeKey, address);
}

export async function getPubKey(key: 'hot' | 'vault'): Promise<string | null> {
  const storeKey = key === 'hot' ? SECURE_STORE_KEYS.HOT_PUBKEY : SECURE_STORE_KEYS.VAULT_PUBKEY;
  return SecureStore.getItemAsync(storeKey);
}

export async function storeNetwork(network: Network): Promise<void> {
  await SecureStore.setItemAsync(SECURE_STORE_KEYS.SELECTED_NETWORK, network);
}

export async function getNetwork(): Promise<Network | null> {
  const val = await SecureStore.getItemAsync(SECURE_STORE_KEYS.SELECTED_NETWORK);
  if (val === 'mainnet' || val === 'devnet' || val === 'testnet') return val;
  return null;
}

export async function storeRules(rules: RuleConfig): Promise<void> {
  await SecureStore.setItemAsync(SECURE_STORE_KEYS.RULES, JSON.stringify(rules));
}

export async function getRules(): Promise<RuleConfig | null> {
  const val = await SecureStore.getItemAsync(SECURE_STORE_KEYS.RULES);
  if (!val) return null;
  return JSON.parse(val) as RuleConfig;
}

export async function getDailySpent(): Promise<{ date: string; amount: number }> {
  const val = await SecureStore.getItemAsync(SECURE_STORE_KEYS.DAILY_SPENT);
  if (!val) return { date: new Date().toISOString().slice(0, 10), amount: 0 };
  return JSON.parse(val);
}

export async function setDailySpent(spent: { date: string; amount: number }): Promise<void> {
  await SecureStore.setItemAsync(SECURE_STORE_KEYS.DAILY_SPENT, JSON.stringify(spent));
}

export async function getSeenAddresses(): Promise<string[]> {
  const val = await SecureStore.getItemAsync(SECURE_STORE_KEYS.SEEN_ADDRESSES);
  if (!val) return [];
  return JSON.parse(val);
}

export async function addSeenAddress(address: string): Promise<void> {
  const seen = await getSeenAddresses();
  if (!seen.includes(address)) {
    seen.push(address);
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.SEEN_ADDRESSES, JSON.stringify(seen));
  }
}

export async function getTxTimestamps(): Promise<number[]> {
  const val = await SecureStore.getItemAsync(SECURE_STORE_KEYS.TX_TIMESTAMPS);
  if (!val) return [];
  return JSON.parse(val);
}

export async function addTxTimestamp(): Promise<void> {
  const timestamps = await getTxTimestamps();
  const now = Date.now();
  const recent = timestamps.filter(t => now - t < 3600000);
  recent.push(now);
  await SecureStore.setItemAsync(SECURE_STORE_KEYS.TX_TIMESTAMPS, JSON.stringify(recent));
}

export async function clearWallet(): Promise<void> {
  await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.MNEMONIC);
  await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.HOT_PUBKEY);
  await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.VAULT_PUBKEY);
  await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.DAILY_SPENT);
  await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.SEEN_ADDRESSES);
  await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.TX_TIMESTAMPS);
}
