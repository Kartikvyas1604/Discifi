import { useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { T, formatCurrency, formatCompact } from '../theme';
import { WalletIcon, ArrowUpIcon, ArrowDownIcon, HistoryIcon, MoreIcon, CopyIcon, SparklesIcon } from '../components/Icons';

interface Token {
  symbol: string;
  name: string;
  balance: number;
  value: number;
  change24h: number;
  color: string;
}

interface Tx {
  id: string;
  type: 'send' | 'receive' | 'swap';
  protocol: string;
  amount: number;
  usdValue: number;
  date: string;
  token: string;
}

const MOCK_TOKENS: Token[] = [
  { symbol: 'SOL', name: 'Solana', balance: 142.5, value: 28425.00, change24h: 3.2, color: '#9945FF' },
  { symbol: 'USDC', name: 'USD Coin', balance: 8420.50, value: 8420.50, change24h: 0.01, color: '#2775CA' },
  { symbol: 'JUP', name: 'Jupiter', balance: 1250, value: 3125.00, change24h: -1.8, color: '#F7931A' },
  { symbol: 'BONK', name: 'Bonk', balance: 12500000, value: 2880.25, change24h: 12.4, color: '#FFD60A' },
];

const MOCK_TXS: Tx[] = [
  { id: '1', type: 'swap', protocol: 'Jupiter DEX', amount: 1240, usdValue: 1240, date: '12m ago', token: 'USDC' },
  { id: '2', type: 'receive', protocol: 'Coinbase', amount: 500, usdValue: 500, date: '1h ago', token: 'USDC' },
  { id: '3', type: 'send', protocol: 'Magic Eden', amount: 0.5, usdValue: 80, date: '3h ago', token: 'SOL' },
  { id: '4', type: 'swap', protocol: 'Orca LP', amount: 2450, usdValue: 2450, date: '5h ago', token: 'USDC' },
  { id: '5', type: 'receive', protocol: 'Solend', amount: 1200, usdValue: 1200, date: '12h ago', token: 'USDC' },
  { id: '6', type: 'send', protocol: 'Drift Protocol', amount: 1.2, usdValue: 240, date: '1d ago', token: 'SOL' },
];

function formatTokenBalance(balance: number, symbol: string): string {
  if (balance >= 1000) return balance.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (balance >= 1) return balance.toFixed(2);
  return balance.toFixed(4);
}

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [totalValue] = useState(42850.75);
  const [change24h] = useState(3.2);

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerLeft} onPress={() => navigation.navigate('Settings')} activeOpacity={0.7}>
            <View style={styles.avatar}>
              <SparklesIcon size={18} color={T.accentLight} />
            </View>
            <View>
              <Text style={styles.greeting}>Good morning</Text>
              <View style={styles.addressRow}>
                <Text style={styles.address}>0x4f3c...b82a</Text>
                <CopyIcon size={12} color={T.inkMuted} />
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreBtn} onPress={() => navigation.navigate('Settings')} activeOpacity={0.7}>
            <MoreIcon size={20} color={T.ink} />
          </TouchableOpacity>
        </View>

        {/* Portfolio Card */}
        <View style={styles.portfolioCard}>
          <View style={styles.portfolioGlow} />
          <Text style={styles.portfolioLabel}>Total Balance</Text>
          <Text style={styles.portfolioValue}>${formatCurrency(totalValue)}</Text>
          <View style={styles.changeRow}>
            <View style={styles.changeBadge}>
              <ArrowUpIcon size={12} color={T.safe} />
              <Text style={styles.changeText}>{change24h}%</Text>
            </View>
            <Text style={styles.changePeriod}>vs last week</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Send')} activeOpacity={0.8}>
            <View style={[styles.quickActionIcon, { backgroundColor: T.accent + '20' }]}>
              <ArrowUpIcon size={20} color={T.accentLight} />
            </View>
            <Text style={styles.quickActionLabel}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Receive')} activeOpacity={0.8}>
            <View style={[styles.quickActionIcon, { backgroundColor: T.safe + '20' }]}>
              <ArrowDownIcon size={20} color={T.safe} />
            </View>
            <Text style={styles.quickActionLabel}>Receive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Swap')} activeOpacity={0.8}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#FFD60A20' }]}>
              <SparklesIcon size={18} color={T.warning} />
            </View>
            <Text style={styles.quickActionLabel}>Swap</Text>
          </TouchableOpacity>
        </View>

        {/* Tokens Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tokens</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.sectionAction}>Manage</Text>
            </TouchableOpacity>
          </View>

          {MOCK_TOKENS.map((token, i) => (
            <TouchableOpacity
              key={token.symbol}
              style={[styles.tokenRow, i === MOCK_TOKENS.length - 1 && { borderBottomWidth: 0 }]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('TokenDetail', {
                symbol: token.symbol,
                name: token.name,
                value: token.value,
                change24h: token.change24h,
                color: token.color,
              })}
            >
              <View style={[styles.tokenIcon, { backgroundColor: token.color + '20' }]}>
                <Text style={[styles.tokenInitial, { color: token.color }]}>
                  {token.symbol[0]}
                </Text>
              </View>
              <View style={styles.tokenInfo}>
                <Text style={styles.tokenSymbol}>{token.symbol}</Text>
                <Text style={styles.tokenName}>{token.name}</Text>
              </View>
              <View style={styles.tokenBalance}>
                <Text style={styles.tokenValue}>${formatCompact(token.value)}</Text>
                <Text style={styles.tokenAmount}>
                  {formatTokenBalance(token.balance, token.symbol)} {token.symbol}
                </Text>
              </View>
              <Text style={[styles.tokenChange, { color: token.change24h >= 0 ? T.safe : T.danger }]}>
                {token.change24h >= 0 ? '+' : ''}{token.change24h}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transactions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Activity</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Activity')}>
              <Text style={styles.sectionAction}>View all</Text>
            </TouchableOpacity>
          </View>

          {MOCK_TXS.map((tx) => (
            <TouchableOpacity
              key={tx.id}
              style={styles.txRow}
              activeOpacity={0.7}
            >
              <View style={[styles.txIcon, {
                backgroundColor: tx.type === 'receive' ? T.safe + '20' : tx.type === 'send' ? T.danger + '20' : T.accent + '20'
              }]}>
                {tx.type === 'receive' ? (
                  <ArrowDownIcon size={14} color={T.safe} />
                ) : tx.type === 'send' ? (
                  <ArrowUpIcon size={14} color={T.danger} />
                ) : (
                  <SparklesIcon size={12} color={T.accentLight} />
                )}
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txProtocol}>{tx.protocol}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>
              <View style={styles.txAmountCol}>
                <Text style={[styles.txValue, {
                  color: tx.type === 'receive' ? T.safe : tx.type === 'send' ? T.ink : T.ink
                }]}>
                  {tx.type === 'receive' ? '+' : tx.type === 'send' ? '-' : ''}${formatCompact(tx.usdValue)}
                </Text>
                <Text style={styles.txToken}>
                  {tx.type === 'swap' ? '→' : ''} {tx.amount} {tx.token}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: T.s4,
    paddingTop: 56,
    paddingBottom: T.s5,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.s3,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: T.radiusFull,
    backgroundColor: T.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontFamily: T.fontSemiBold,
    fontSize: 15,
    color: T.ink,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.s1,
  },
  address: {
    fontFamily: T.fontFamily,
    fontSize: 12,
    color: T.inkMuted,
  },
  moreBtn: {
    width: 36,
    height: 36,
    borderRadius: T.radiusFull,
    backgroundColor: T.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioCard: {
    marginHorizontal: T.s4,
    padding: T.s5,
    borderRadius: T.radius,
    backgroundColor: T.surface,
    position: 'relative',
    overflow: 'hidden',
  },
  portfolioGlow: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: T.accent,
    opacity: 0.08,
  },
  portfolioLabel: {
    fontFamily: T.fontFamily,
    fontSize: 13,
    color: T.inkMuted,
    marginBottom: T.s1,
  },
  portfolioValue: {
    fontFamily: T.fontBold,
    fontSize: 40,
    color: T.ink,
    letterSpacing: -0.5,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.s2,
    marginTop: T.s2,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: T.safe + '20',
    paddingHorizontal: T.s2,
    paddingVertical: 2,
    borderRadius: T.radiusFull,
  },
  changeText: {
    fontFamily: T.fontSemiBold,
    fontSize: 12,
    color: T.safe,
  },
  changePeriod: {
    fontFamily: T.fontFamily,
    fontSize: 12,
    color: T.inkMuted,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: T.s6,
    paddingVertical: T.s5,
    paddingHorizontal: T.s4,
  },
  quickAction: {
    alignItems: 'center',
    gap: T.s2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: T.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontFamily: T.fontFamily,
    fontSize: 12,
    color: T.inkMuted,
  },
  section: {
    paddingHorizontal: T.s4,
    marginTop: T.s3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.s2,
  },
  sectionTitle: {
    fontFamily: T.fontSemiBold,
    fontSize: 17,
    color: T.ink,
  },
  sectionAction: {
    fontFamily: T.fontFamily,
    fontSize: 13,
    color: T.accent,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: T.s3,
    borderBottomWidth: T.hairline,
    borderBottomColor: T.border,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: T.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenInitial: {
    fontFamily: T.fontBold,
    fontSize: 16,
  },
  tokenInfo: {
    flex: 1,
    marginLeft: T.s3,
  },
  tokenSymbol: {
    fontFamily: T.fontSemiBold,
    fontSize: 15,
    color: T.ink,
  },
  tokenName: {
    fontFamily: T.fontFamily,
    fontSize: 12,
    color: T.inkMuted,
  },
  tokenBalance: {
    alignItems: 'flex-end',
    marginRight: T.s3,
  },
  tokenValue: {
    fontFamily: T.fontSemiBold,
    fontSize: 15,
    color: T.ink,
  },
  tokenAmount: {
    fontFamily: T.fontFamily,
    fontSize: 11,
    color: T.inkMuted,
  },
  tokenChange: {
    fontFamily: T.fontSemiBold,
    fontSize: 13,
    minWidth: 55,
    textAlign: 'right',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: T.s3,
    borderBottomWidth: T.hairline,
    borderBottomColor: T.border,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: T.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    marginLeft: T.s3,
  },
  txProtocol: {
    fontFamily: T.fontFamily,
    fontSize: 14,
    color: T.ink,
  },
  txDate: {
    fontFamily: T.fontFamily,
    fontSize: 11,
    color: T.inkMuted,
    marginTop: 1,
  },
  txAmountCol: {
    alignItems: 'flex-end',
  },
  txValue: {
    fontFamily: T.fontSemiBold,
    fontSize: 14,
  },
  txToken: {
    fontFamily: T.fontFamily,
    fontSize: 11,
    color: T.inkMuted,
    marginTop: 1,
  },
});
