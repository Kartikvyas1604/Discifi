import { useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Keypair } from '@solana/web3.js';
import { T } from '../theme';
import { CloseIcon, SwapIcon } from '../components/Icons';
import { useWallet } from '../services/WalletContext';
import { useNetwork } from '../services/NetworkContext';
import { useWalletData } from '../services/useWalletData';
import { getJupiterQuote, executeJupiterSwap } from '../services/swapService';
import { getMnemonic, getRules } from '../services/secureStorage';
import { mnemonicToSeed } from '../crypto/bip39';
import { deriveKeypair } from '../crypto/address';
import { DEFAULT_RULES } from '../services/types';
import { checkAllRules, recordTransaction } from '../services/ruleEngine';

const WSOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

interface TokenOption {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
}

export default function SwapScreen({ navigation }: any) {
  const { hotPublicKey } = useWallet();
  const { connection } = useNetwork();
  const { walletData } = useWalletData(hotPublicKey);
  const [fromMint, setFromMint] = useState(WSOL_MINT);
  const [toMint, setToMint] = useState(USDC_MINT);
  const [fromAmount, setFromAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [txSignature, setTxSignature] = useState('');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const tokens: TokenOption[] = walletData.tokens.length > 0
    ? walletData.tokens.map(t => ({ mint: t.mint, symbol: t.symbol, name: t.name, balance: t.balance, decimals: t.decimals }))
    : [
        { mint: WSOL_MINT, symbol: 'SOL', name: 'Solana', balance: 0, decimals: 9 },
        { mint: USDC_MINT, symbol: 'USDC', name: 'USD Coin', balance: 0, decimals: 6 },
      ];

  const fromToken = tokens.find(t => t.mint === fromMint) || tokens[0];
  const toToken = tokens.find(t => t.mint === toMint) || tokens[1];

  const handleGetQuote = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;
    setLoading(true);
    try {
      const rules = (await getRules()) || DEFAULT_RULES;
      const rawAmount = Math.floor(parseFloat(fromAmount) * Math.pow(10, fromToken.decimals));
      const q = await getJupiterQuote({
        inputMint: fromMint,
        outputMint: toMint,
        amount: rawAmount,
        slippageBps: rules.slippageBps,
      });
      setQuote(q);
    } catch (err: any) {
      Alert.alert('Quote Failed', err.message || 'Could not get swap quote');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!quote || !hotPublicKey) return;
    setSwapping(true);
    try {
      const usdValue = parseFloat(fromAmount || '0') * (walletData.tokens.find(t => t.mint === fromMint)?.priceUsd || 0);
      const rulesCheck = await checkAllRules(usdValue, 'swap');
      if (!rulesCheck.allowed) {
        Alert.alert('Rule Blocked', rulesCheck.message || '');
        setSwapping(false);
        return;
      }

      const mnemonicStr = await getMnemonic();
      if (!mnemonicStr) throw new Error('Wallet not found');
      const words = mnemonicStr.split(' ');
      const seed = await mnemonicToSeed(words, '');
      const kp = deriveKeypair(seed, "m/44'/501'/0'/0'");
      const wallet = Keypair.fromSeed(kp.privateKey);

      const sig = await executeJupiterSwap(connection, wallet, quote.rawQuote);
      setTxSignature(sig);
      await recordTransaction(usdValue, 'swap');
    } catch (err: any) {
      Alert.alert('Swap Failed', err.message || 'Swap execution failed');
    } finally {
      setSwapping(false);
    }
  };

  const handleSwapTokens = () => {
    setFromMint(toMint);
    setToMint(fromMint);
    setFromAmount('');
    setQuote(null);
  };

  const estimatedToAmount = quote ? (parseInt(quote.outputAmount) / Math.pow(10, toToken.decimals)).toFixed(6) : '';

  const TokenPicker = ({ onSelect, onClose, exclude }: { onSelect: (m: string) => void; onClose: () => void; exclude: string }) => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
          <CloseIcon size={24} color={T.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Token</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: T.s4, paddingBottom: T.s5 }}>
        {tokens.filter(t => t.mint !== exclude).map(t => (
          <TouchableOpacity key={t.mint} style={styles.tokenRow} onPress={() => onSelect(t.mint)} activeOpacity={0.7}>
            <View style={[styles.tokenDot, { backgroundColor: t.mint === WSOL_MINT ? '#9945FF20' : '#2775CA20' }]}>
              <Text style={[styles.tokenInitial, { color: t.mint === WSOL_MINT ? '#9945FF' : '#2775CA' }]}>{t.symbol[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tokenSymbol}>{t.symbol}</Text>
              <Text style={styles.tokenName}>{t.name}</Text>
            </View>
            <Text style={styles.balanceVal}>{t.balance.toFixed(4)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (showFromPicker) return <TokenPicker onSelect={(m) => { setFromMint(m); setShowFromPicker(false); setQuote(null); }} onClose={() => setShowFromPicker(false)} exclude={toMint} />;
  if (showToPicker) return <TokenPicker onSelect={(m) => { setToMint(m); setShowToPicker(false); setQuote(null); }} onClose={() => setShowToPicker(false)} exclude={fromMint} />;

  if (swapping) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={T.accent} />
          <Text style={styles.sendingText}>Swapping tokens...</Text>
          <Text style={styles.sendingSubtext}>Executing swap via Jupiter</Text>
        </View>
      </View>
    );
  }

  if (txSignature) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <View style={[styles.confirmIcon, { backgroundColor: T.safe + '20' }]}>
            <Text style={{ fontSize: 32, color: T.safe }}>✓</Text>
          </View>
          <Text style={styles.confirmAmount}>Swap Complete</Text>
          <Text style={styles.confirmUsd}>{fromAmount} {fromToken.symbol} → {estimatedToAmount} {toToken.symbol}</Text>
          <View style={styles.detailSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Signature</Text>
              <Text style={styles.detailValue}>{txSignature.slice(0, 8)}...{txSignature.slice(-4)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <CloseIcon size={24} color={T.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Swap</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: T.s4, paddingBottom: T.s5 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.tokenSection}>
            <View style={styles.tokenSectionHeader}>
              <Text style={styles.tokenSectionLabel}>You Pay</Text>
              <Text style={styles.balanceText}>Balance: {fromToken.balance.toFixed(4)}</Text>
            </View>
            <View style={styles.tokenInputRow}>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={T.inkFaint}
                value={fromAmount}
                onChangeText={(v) => { setFromAmount(v); setQuote(null); }}
                keyboardType="decimal-pad"
              />
              <TouchableOpacity style={styles.tokenChip} onPress={() => setShowFromPicker(true)} activeOpacity={0.7}>
                <View style={[styles.tinyDot, { backgroundColor: fromToken.mint === WSOL_MINT ? '#9945FF20' : '#2775CA20' }]}>
                  <Text style={[styles.tinyInitial, { color: fromToken.mint === WSOL_MINT ? '#9945FF' : '#2775CA' }]}>{fromToken.symbol[0]}</Text>
                </View>
                <Text style={styles.tokenChipLabel}>{fromToken.symbol}</Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.swapBtnContainer}>
            <View style={styles.swapLine} />
            <TouchableOpacity style={styles.swapBtn} onPress={handleSwapTokens} activeOpacity={0.8}>
              <SwapIcon size={20} color={T.accent} />
            </TouchableOpacity>
            <View style={styles.swapLine} />
          </View>

          <View style={styles.tokenSection}>
            <View style={styles.tokenSectionHeader}>
              <Text style={styles.tokenSectionLabel}>You Receive</Text>
            </View>
            <View style={styles.tokenInputRow}>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={T.inkFaint}
                value={estimatedToAmount}
                editable={false}
              />
              <TouchableOpacity style={styles.tokenChip} onPress={() => setShowToPicker(true)} activeOpacity={0.7}>
                <View style={[styles.tinyDot, { backgroundColor: toToken.mint === WSOL_MINT ? '#9945FF20' : '#2775CA20' }]}>
                  <Text style={[styles.tinyInitial, { color: toToken.mint === WSOL_MINT ? '#9945FF' : '#2775CA' }]}>{toToken.symbol[0]}</Text>
                </View>
                <Text style={styles.tokenChipLabel}>{toToken.symbol}</Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {fromAmount && !quote && (
          <TouchableOpacity style={[styles.getQuoteBtn, loading && { opacity: 0.5 }]} onPress={handleGetQuote} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color={T.ink} /> : <Text style={styles.getQuoteText}>Get Quote</Text>}
          </TouchableOpacity>
        )}

        {quote && (
          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <Text style={styles.routeLabel}>Rate</Text>
              <Text style={styles.routeValue}>1 {fromToken.symbol} = {quote.outputAmount && fromAmount ? (parseInt(quote.outputAmount) / Math.pow(10, toToken.decimals) / parseFloat(fromAmount)).toFixed(6) : '...'} {toToken.symbol}</Text>
            </View>
            <View style={styles.routeDivider} />
            <View style={styles.routeRow}>
              <Text style={styles.routeLabel}>Price Impact</Text>
              <Text style={[styles.routeValue, { color: (quote.priceImpact || 0) > 0.01 ? T.danger : T.ink }]}>
                {(quote.priceImpact * 100 || 0).toFixed(2)}%
              </Text>
            </View>
            <View style={styles.routeDivider} />
            <View style={styles.routeRow}>
              <Text style={styles.routeLabel}>Route</Text>
              <Text style={styles.routeValue}>{quote.route.join(' → ') || 'Jupiter'}</Text>
            </View>
            <View style={styles.routeDivider} />
            <View style={styles.routeRow}>
              <Text style={styles.routeLabel}>Min Received</Text>
              <Text style={styles.routeValue}>{(quote.minimumOutput / Math.pow(10, toToken.decimals)).toFixed(6)} {toToken.symbol}</Text>
            </View>
          </View>
        )}

        {quote && (
          <TouchableOpacity style={styles.swapActionBtn} onPress={handleSwap} activeOpacity={0.8}>
            <Text style={styles.swapActionText}>Swap {fromToken.symbol} for {toToken.symbol}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: T.s4, paddingTop: 56, paddingBottom: T.s4 },
  headerTitle: { fontFamily: T.fontBold, fontSize: 18, color: T.ink },
  card: { backgroundColor: T.surface, borderRadius: T.radius, padding: T.s4, marginBottom: T.s5 },
  tokenSection: { marginBottom: T.s2 },
  tokenSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: T.s2 },
  tokenSectionLabel: { fontFamily: T.fontFamily, fontSize: 12, color: T.inkMuted },
  balanceText: { fontFamily: T.fontFamily, fontSize: 12, color: T.accent },
  tokenInputRow: { flexDirection: 'row', alignItems: 'center', gap: T.s3 },
  amountInput: { flex: 1, fontFamily: T.fontBold, fontSize: 28, color: T.ink, paddingVertical: T.s2, letterSpacing: -0.5 },
  tokenChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.bg, borderRadius: T.radiusFull, paddingVertical: T.s2, paddingLeft: T.s2, paddingRight: T.s3, gap: T.s1 },
  tinyDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tinyInitial: { fontFamily: T.fontBold, fontSize: 12 },
  tokenChipLabel: { fontFamily: T.fontSemiBold, fontSize: 14, color: T.ink },
  chevron: { fontSize: 16, color: T.inkFaint, fontFamily: T.fontFamily },
  swapBtnContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: T.s2 },
  swapLine: { flex: 1, height: T.hairline, backgroundColor: T.border },
  swapBtn: { width: 40, height: 40, borderRadius: T.radiusFull, backgroundColor: T.accent + '20', alignItems: 'center', justifyContent: 'center', marginHorizontal: T.s3 },
  getQuoteBtn: { backgroundColor: T.accent, paddingVertical: T.s4, borderRadius: T.radius, alignItems: 'center', marginBottom: T.s4 },
  getQuoteText: { fontFamily: T.fontSemiBold, fontSize: 16, color: T.ink },
  routeCard: { backgroundColor: T.surface, borderRadius: T.radius, padding: T.s4, marginBottom: T.s5 },
  routeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: T.s2 },
  routeLabel: { fontFamily: T.fontFamily, fontSize: 13, color: T.inkMuted },
  routeValue: { fontFamily: T.fontSemiBold, fontSize: 13, color: T.ink },
  routeDivider: { height: T.hairline, backgroundColor: T.border },
  swapActionBtn: { backgroundColor: T.accent, paddingVertical: T.s4, borderRadius: T.radius, alignItems: 'center' },
  swapActionText: { fontFamily: T.fontSemiBold, fontSize: 16, color: T.ink },
  tokenRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.surface, borderRadius: T.radius, padding: T.s4, marginBottom: T.s2 },
  tokenSymbol: { fontFamily: T.fontSemiBold, fontSize: 15, color: T.ink },
  tokenName: { fontFamily: T.fontFamily, fontSize: 12, color: T.inkMuted },
  balanceVal: { fontFamily: T.fontSemiBold, fontSize: 15, color: T.ink },
  tokenDot: { width: 40, height: 40, borderRadius: T.radiusFull, alignItems: 'center', justifyContent: 'center', marginRight: T.s3 },
  tokenInitial: { fontFamily: T.fontBold, fontSize: 16 },
  confirmIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: T.safe + '20', alignItems: 'center', justifyContent: 'center', marginBottom: T.s4 },
  confirmAmount: { fontFamily: T.fontBold, fontSize: 36, color: T.ink, letterSpacing: -0.5 },
  confirmUsd: { fontFamily: T.fontFamily, fontSize: 16, color: T.inkMuted, marginBottom: T.s6 },
  detailSection: { backgroundColor: T.surface, borderRadius: T.radius, padding: T.s4, width: '100%', marginBottom: T.s6 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: T.s2 },
  detailLabel: { fontFamily: T.fontFamily, fontSize: 13, color: T.inkMuted },
  detailValue: { fontFamily: T.fontSemiBold, fontSize: 13, color: T.ink },
  primaryBtn: { backgroundColor: T.accent, paddingVertical: T.s4, paddingHorizontal: T.s8, borderRadius: T.radius, alignItems: 'center' },
  primaryBtnText: { fontFamily: T.fontSemiBold, fontSize: 16, color: T.ink },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: T.s4, gap: T.s4 },
  sendingText: { fontFamily: T.fontSemiBold, fontSize: 18, color: T.ink },
  sendingSubtext: { fontFamily: T.fontFamily, fontSize: 14, color: T.inkMuted },
});
