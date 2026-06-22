import { Alert, Linking } from 'react-native';
import { getRules, getDailySpent, setDailySpent, getSeenAddresses, addSeenAddress, getTxTimestamps, addTxTimestamp } from './secureStorage';
import { DEFAULT_RULES, type RuleConfig } from './types';

export interface RuleCheckResult {
  allowed: boolean;
  message?: string;
}

export async function checkDailyLimit(usdValue: number): Promise<RuleCheckResult> {
  const rules = (await getRules()) || DEFAULT_RULES;
  const spent = await getDailySpent();
  const today = new Date().toISOString().slice(0, 10);

  if (spent.date !== today) {
    await setDailySpent({ date: today, amount: 0 });
    spent.amount = 0;
    spent.date = today;
  }

  const newTotal = spent.amount + usdValue;
  if (newTotal > rules.dailyLimit) {
    const remaining = Math.max(0, rules.dailyLimit - spent.amount);
    return {
      allowed: false,
      message: `This transaction would exceed your $${rules.dailyLimit.toLocaleString()} daily limit. You have $${remaining.toFixed(2)} remaining today.`,
    };
  }

  return { allowed: true };
}

export async function checkPerTxLimit(usdValue: number): Promise<RuleCheckResult> {
  const rules = (await getRules()) || DEFAULT_RULES;
  if (usdValue > rules.perTxLimit) {
    return {
      allowed: false,
      message: `This transaction of $${usdValue.toFixed(2)} exceeds your per-transaction limit of $${rules.perTxLimit.toLocaleString()}.`,
    };
  }
  return { allowed: true };
}

export async function checkNewAddress(address: string, usdValue: number): Promise<RuleCheckResult> {
  const rules = (await getRules()) || DEFAULT_RULES;
  const seen = await getSeenAddresses();

  if (!seen.includes(address) && usdValue > rules.quarantineLimit) {
    return {
      allowed: false,
      message: `New address — transfers limited to $${rules.quarantineLimit} for 24 hours for your protection.`,
    };
  }
  return { allowed: true };
}

export async function checkVelocity(): Promise<RuleCheckResult> {
  const rules = (await getRules()) || DEFAULT_RULES;
  const timestamps = await getTxTimestamps();
  const now = Date.now();
  const recent = timestamps.filter(t => now - t < 3600000);

  if (recent.length >= rules.velocityLimit) {
    return {
      allowed: false,
      message: `You've made too many transactions recently. Please wait a few minutes before sending again.`,
    };
  }

  return { allowed: true };
}

export async function recordTransaction(usdValue: number, address: string): Promise<void> {
  const rules = (await getRules()) || DEFAULT_RULES;
  const spent = await getDailySpent();
  const today = new Date().toISOString().slice(0, 10);

  if (spent.date !== today) {
    await setDailySpent({ date: today, amount: usdValue });
  } else {
    await setDailySpent({ date: today, amount: spent.amount + usdValue });
  }

  await addSeenAddress(address);
  await addTxTimestamp();
}

export async function checkAllRules(usdValue: number, recipient: string): Promise<RuleCheckResult> {
  const checks = await Promise.all([
    checkDailyLimit(usdValue),
    checkPerTxLimit(usdValue),
    checkNewAddress(recipient, usdValue),
    checkVelocity(),
  ]);

  for (const check of checks) {
    if (!check.allowed) return check;
  }

  return { allowed: true };
}
