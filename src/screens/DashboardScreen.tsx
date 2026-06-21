import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PublicKey } from '@solana/web3.js';
import * as Clipboard from 'expo-clipboard';
import { T, formatCurrency, formatCompact } from '../theme';
import { WalletIcon, ArrowUpIcon, ArrowDownIcon, HistoryIcon, MoreIcon, CopyIcon, SparklesIcon, DisciFiLogo } from '../components/Icons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useWallet } from '../services/WalletContext';
import { useNetwork } from '../services/NetworkContext';
import { useWalletData } from '../services/useWalletData';
import { NETWORK_COLORS, NETWORK_LABELS } from '../services/constants';
import { requestAirdrop } from '../services/faucetService';
import { walletEvents, EVENTS, type TransactionConfirmedPayload } from '../services/WalletEvents';
import type { ParsedTransaction } from '../services/types';
import { Alert } from 'react-native';

function formatTokenBalance(balance: number, symbol: string): string {
  if (balance >= 1000) return balance.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (balance >= 1) return balance.toFixed(2);
  return balance.toFixed(4);
}

function formatAddress(addr: string): string {
  if (addr.length <= 8) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { hotAddress, hotPublicKey } = useWallet();
  const { network, connection } = useNetwork();
  const publicKey = useWallet().hotPublicKey;
  const { walletData, transactions, refetch } = useWalletData(publicKey);
  const [copied, setCopied] = useState(false);
  const [airdropLoading, setAirdropLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingTxs, setPendingTxs] = useState<ParsedTransaction[]>([]);
  const [forceRefreshKey, setForceRefreshKey] = useState(0);

  const handleCopyAddress = () => {
    Clipboard.setStringAsync(hotAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAirdrop = async () => {
    if (!publicKey) return;
    setAirdropLoading(true);
    try {
      const sig = await requestAirdrop(connection, publicKey);
      Alert.alert('Airdrop Sent', `1 SOL airdropped successfully!\n${sig.slice(0, 16)}...`);
      refetch();
    } catch {
      Alert.alert('Airdrop Failed', 'Airdrop failed — the devnet faucet may be rate limiting. Try again later.');
    } finally {
      setAirdropLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  useEffect(() => {
    if (!hotPublicKey) return;

    const handleTxConfirm = (payload: TransactionConfirmedPayload) => {
      setPendingTxs(prev => prev.filter(tx => tx.signature !== payload.signature));
      setForceRefreshKey(k => k + 1);
      refetch();
    };

    const handleBalanceRefresh = () => {
      refetch();
    };

    walletEvents.on(EVENTS.TRANSACTION_CONFIRMED, handleTxConfirm);
    walletEvents.on(EVENTS.BALANCE_SHOULD_REFRESH, handleBalanceRefresh);

    const subscriptionId = connection.onAccountChange(
      new PublicKey(hotPublicKey),
      () => {
        refetch();
      },
      'confirmed',
    );

    return () => {
      walletEvents.off(EVENTS.TRANSACTION_CONFIRMED, handleTxConfirm);
      walletEvents.off(EVENTS.BALANCE_SHOULD_REFRESH, handleBalanceRefresh);
      connection.removeAccountChangeListener(subscriptionId);
    };
  }, [hotPublicKey, connection, refetch]);

  useEffect(() => {
    if (!transactions || transactions.length === 0) return;
    setPendingTxs(prev => {
      const pending = prev.filter(p => !transactions.some(t => t.signature === p.signature));
      if (pending.length === prev.length) return prev;
      return pending;
    });
  }, [transactions, forceRefreshKey]);

  const allTransactions = [...pendingTxs, ...transactions];

  const networkColor = NETWORK_COLORS[network] || '#8E8E93';

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: T.s5 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#7C3AED"
            colors={['#7C3AED']}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerLeft} onPress={() => navigation.navigate('Settings')} activeOpacity={0.7}>
            <DisciFiLogo size={36} />
            <View>
              <Text style={styles.greeting}>Good morning</Text>
              <View style={styles.addressRow}>
                <View style={[styles.networkDot, { backgroundColor: networkColor }]} />
                <Text style={styles.address}>{formatAddress(hotAddress)}</Text>
                <TouchableOpacity onPress={handleCopyAddress} activeOpacity={0.7}>
                  {copied ? <Text style={styles.copiedBadge}>✓</Text> : <CopyIcon size={12} color={T.inkMuted} />}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Settings')} activeOpacity={0.7}>
            <Ionicons name="person-outline" size={18} color={T.inkMuted} />
          </TouchableOpacity>
        </View>

        {/* Portfolio Card */}
        <View style={styles.portfolioCard}>
          <View style={styles.portfolioGlow} />
          <Text style={styles.portfolioLabel}>Total Balance</Text>
          {walletData.loading ? (
            <ActivityIndicator color={T.accent} style={{ marginVertical: 20 }} />
          ) : (
            <Text style={styles.portfolioValue}>${formatCurrency(walletData.totalUsdValue)}</Text>
          )}
          <View style={styles.changeRow}>
            <Text style={styles.networkLabel}>{NETWORK_LABELS[network]}</Text>
            <Text style={styles.changePeriod}>Updated {relativeTime(walletData.lastUpdated)}</Text>
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
          {network !== 'mainnet' && (
            <TouchableOpacity style={styles.quickAction} onPress={handleAirdrop} activeOpacity={0.8} disabled={airdropLoading}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#FFD60A20' }]}>
                {airdropLoading ? (
                  <ActivityIndicator size="small" color={T.warning} />
                ) : (
                  <Ionicons name="water-outline" size={20} color={T.warning} />
                )}
              </View>
              <Text style={styles.quickActionLabel}>Airdrop</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tokens Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tokens</Text>
          </View>

          {walletData.loading ? (
            <View style={{ padding: T.s4, alignItems: 'center' }}>
              <ActivityIndicator color={T.accent} />
            </View>
          ) : walletData.tokens.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No tokens yet</Text>
            </View>
          ) : (
            walletData.tokens.map((token, i) => (
              <TouchableOpacity
                key={token.mint}
                style={[styles.tokenRow, i === walletData.tokens.length - 1 && { borderBottomWidth: 0 }]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('TokenDetail', {
                  symbol: token.symbol,
                  name: token.name,
                  mint: token.mint,
                  balance: token.balance,
                  value: token.usdValue,
                  usdValue: token.usdValue,
                  change24h: token.change24h || 0,
                  color: token.mint === 'So11111111111111111111111111111111111111112' ? '#9945FF' : '#2775CA',
                })}
              >
                <View style={[styles.tokenIcon, { backgroundColor: token.mint === 'So11111111111111111111111111111111111111112' ? '#9945FF20' : '#2775CA20' }]}>
                  <Text style={[styles.tokenInitial, { color: token.mint === 'So11111111111111111111111111111111111111112' ? '#9945FF' : '#2775CA' }]}>
                    {token.symbol[0]}
                  </Text>
                </View>
                <View style={styles.tokenInfo}>
                  <Text style={styles.tokenSymbol}>{token.symbol}</Text>
                  <Text style={styles.tokenName}>{token.name}</Text>
                </View>
                <View style={styles.tokenBalance}>
                  <Text style={styles.tokenValue}>${formatCompact(token.usdValue)}</Text>
                  <Text style={styles.tokenAmount}>
                    {formatTokenBalance(token.balance, token.symbol)} {token.symbol}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Transactions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Activity</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Activity')}>
              <Text style={styles.sectionAction}>View all</Text>
            </TouchableOpacity>
          </View>

          {allTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            allTransactions.slice(0, 5).map((tx, i) => (
              <View key={tx.signature || `pending-${i}`} style={styles.txRow}>
                <View style={[styles.txIcon, {
                  backgroundColor: tx.status === 'pending' ? T.warning + '20' :
                    tx.type === 'receive' ? T.safe + '20' : tx.type === 'send' ? T.danger + '20' : T.accent + '20'
                }]}>
                  {tx.status === 'pending' ? (
                    <ActivityIndicator size="small" color={T.warning} />
                  ) : tx.type === 'receive' ? (
                    <ArrowDownIcon size={14} color={T.safe} />
                  ) : tx.type === 'send' ? (
                    <ArrowUpIcon size={14} color={T.danger} />
                  ) : (
                    <SparklesIcon size={12} color={T.accentLight} />
                  )}
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txProtocol}>
                    {tx.status === 'pending' ? 'Sending...' : tx.protocol}
                  </Text>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>
                <View style={styles.txAmountCol}>
                  <Text style={[styles.txValue, {
                    color: tx.status === 'pending' ? T.warning :
                      tx.type === 'receive' ? T.safe : T.ink
                  }]}>
                    {tx.type === 'receive' ? '+' : tx.type === 'send' ? '-' : ''}{tx.amount} {tx.token}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: T.s4, paddingTop: 56, paddingBottom: T.s4 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: T.s3 },
  greeting: { fontFamily: T.fontSemiBold, fontSize: 15, color: T.ink },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: T.s1 },
  address: { fontFamily: T.fontFamily, fontSize: 12, color: T.inkMuted },
  networkDot: { width: 8, height: 8, borderRadius: 4 },
  copiedBadge: { fontFamily: T.fontBold, fontSize: 12, color: T.safe },
  profileBtn: { width: 36, height: 36, borderRadius: T.radiusFull, backgroundColor: T.surface, alignItems: 'center', justifyContent: 'center' },
  portfolioCard: { marginHorizontal: T.s4, padding: T.s5, borderRadius: T.radius, backgroundColor: T.surface, position: 'relative', overflow: 'hidden' },
  portfolioGlow: { position: 'absolute', top: -60, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: T.accent, opacity: 0.08 },
  portfolioLabel: { fontFamily: T.fontFamily, fontSize: 13, color: T.inkMuted, marginBottom: T.s1 },
  portfolioValue: { fontFamily: T.fontBold, fontSize: 40, color: T.ink, letterSpacing: -0.5 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: T.s2, marginTop: T.s2 },
  networkLabel: { fontFamily: T.fontSemiBold, fontSize: 12, color: T.warning },
  changePeriod: { fontFamily: T.fontFamily, fontSize: 12, color: T.inkMuted },
  quickActions: { flexDirection: 'row', justifyContent: 'center', gap: T.s6, paddingVertical: T.s5, paddingHorizontal: T.s4 },
  quickAction: { alignItems: 'center', gap: T.s2 },
  quickActionIcon: { width: 48, height: 48, borderRadius: T.radiusFull, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { fontFamily: T.fontFamily, fontSize: 12, color: T.inkMuted },
  section: { paddingHorizontal: T.s4, marginBottom: T.s5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: T.s2 },
  sectionTitle: { fontFamily: T.fontSemiBold, fontSize: 17, color: T.ink },
  sectionAction: { fontFamily: T.fontFamily, fontSize: 13, color: T.accent },
  tokenRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: T.s3, borderBottomWidth: T.hairline, borderBottomColor: T.border },
  tokenIcon: { width: 40, height: 40, borderRadius: T.radiusFull, alignItems: 'center', justifyContent: 'center' },
  tokenInitial: { fontFamily: T.fontBold, fontSize: 16 },
  tokenInfo: { flex: 1, marginLeft: T.s3 },
  tokenSymbol: { fontFamily: T.fontSemiBold, fontSize: 15, color: T.ink },
  tokenName: { fontFamily: T.fontFamily, fontSize: 12, color: T.inkMuted },
  tokenBalance: { alignItems: 'flex-end', marginRight: T.s3 },
  tokenValue: { fontFamily: T.fontSemiBold, fontSize: 15, color: T.ink },
  tokenAmount: { fontFamily: T.fontFamily, fontSize: 11, color: T.inkMuted },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: T.s3, borderBottomWidth: T.hairline, borderBottomColor: T.border },
  txIcon: { width: 36, height: 36, borderRadius: T.radiusFull, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1, marginLeft: T.s3 },
  txProtocol: { fontFamily: T.fontFamily, fontSize: 14, color: T.ink },
  txDate: { fontFamily: T.fontFamily, fontSize: 11, color: T.inkMuted, marginTop: T.s1 },
  txAmountCol: { alignItems: 'flex-end' },
  txValue: { fontFamily: T.fontSemiBold, fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: T.s5 },
  emptyText: { fontFamily: T.fontFamily, fontSize: 14, color: T.inkFaint },
});
