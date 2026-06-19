import { useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { T, formatCompact } from '../theme';
import { CloseIcon, SwapIcon, SettingsIcon } from '../components/Icons';

interface Token {
  symbol: string;
  name: string;
  balance: number;
  color: string;
}

const TOKENS: Token[] = [
  { symbol: 'SOL', name: 'Solana', balance: 142.5, color: '#9945FF' },
  { symbol: 'USDC', name: 'USD Coin', balance: 8420.50, color: '#2775CA' },
  { symbol: 'JUP', name: 'Jupiter', balance: 1250, color: '#F7931A' },
  { symbol: 'BONK', name: 'Bonk', balance: 12500000, color: '#FFD60A' },
];

function TokenSelector({
  token,
  amount,
  onAmountChange,
  onTokenPress,
  isSource,
}: {
  token: Token;
  amount: string;
  onAmountChange?: (v: string) => void;
  onTokenPress: () => void;
  isSource: boolean;
}) {
  return (
    <View style={swapStyles.tokenSection}>
      <View style={swapStyles.tokenSectionHeader}>
        <Text style={swapStyles.tokenSectionLabel}>{isSource ? 'You Pay' : 'You Receive'}</Text>
        {isSource && (
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={swapStyles.balanceText}>Balance: {token.balance}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={swapStyles.tokenInputRow}>
        <TextInput
          style={swapStyles.amountInput}
          placeholder="0.00"
          placeholderTextColor={T.inkFaint}
          value={amount}
          onChangeText={onAmountChange}
          keyboardType="decimal-pad"
          editable={isSource}
        />
        <TouchableOpacity style={swapStyles.tokenChip} onPress={onTokenPress} activeOpacity={0.7}>
          <View style={[swapStyles.tokenDot, { backgroundColor: token.color + '20' }]}>
            <Text style={[swapStyles.tokenInitial, { color: token.color }]}>{token.symbol[0]}</Text>
          </View>
          <Text style={swapStyles.tokenChipLabel}>{token.symbol}</Text>
          <Text style={swapStyles.chevron}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SwapScreen({ navigation }: any) {
  const [fromToken, setFromToken] = useState(TOKENS[0]);
  const [toToken, setToToken] = useState(TOKENS[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [slippage] = useState('0.5%');
  const [routeInfo] = useState({ rate: '1 SOL = 175.42 USDC', fee: '~$0.12' });

  const estimatedToAmount = fromAmount
    ? (parseFloat(fromAmount) * (toToken.symbol === 'USDC' ? 175.42 : 0.0057)).toFixed(4)
    : '';

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount('');
  };

  const handleSwap = () => {
    setFromAmount('');
  };

  const TokenPicker = ({ onSelect, onClose }: { onSelect: (t: Token) => void; onClose: () => void }) => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
          <CloseIcon size={24} color={T.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Token</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: T.s4, paddingBottom: T.s5 }}>
        {TOKENS.map((t) => (
          <TouchableOpacity
            key={t.symbol}
            style={swapStyles.pickerRow}
            onPress={() => onSelect(t)}
            activeOpacity={0.7}
          >
            <View style={[swapStyles.tokenDot, { backgroundColor: t.color + '20' }]}>
              <Text style={[swapStyles.tokenInitial, { color: t.color }]}>{t.symbol[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={swapStyles.tokenSymbol}>{t.symbol}</Text>
              <Text style={swapStyles.tokenName}>{t.name}</Text>
            </View>
            <Text style={swapStyles.balanceVal}>{t.balance}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (showFromPicker) return <TokenPicker onSelect={(t) => { setFromToken(t); setShowFromPicker(false); }} onClose={() => setShowFromPicker(false)} />;
  if (showToPicker) return <TokenPicker onSelect={(t) => { setToToken(t); setShowToPicker(false); }} onClose={() => setShowToPicker(false)} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <CloseIcon size={24} color={T.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Swap</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <SettingsIcon size={22} color={T.inkMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: T.s4, paddingBottom: T.s5 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* From */}
        <View style={swapStyles.card}>
          <TokenSelector
            token={fromToken}
            amount={fromAmount}
            onAmountChange={setFromAmount}
            onTokenPress={() => setShowFromPicker(true)}
            isSource
          />

          {/* Swap button */}
          <View style={swapStyles.swapBtnContainer}>
            <View style={swapStyles.swapLine} />
            <TouchableOpacity style={swapStyles.swapBtn} onPress={handleSwapTokens} activeOpacity={0.8}>
              <SwapIcon size={20} color={T.accent} />
            </TouchableOpacity>
            <View style={swapStyles.swapLine} />
          </View>

          {/* To */}
          <TokenSelector
            token={toToken}
            amount={estimatedToAmount}
            onTokenPress={() => setShowToPicker(true)}
            isSource={false}
          />
        </View>

        {/* Route Info */}
        <View style={swapStyles.routeCard}>
          <View style={swapStyles.routeRow}>
            <Text style={swapStyles.routeLabel}>Rate</Text>
            <Text style={swapStyles.routeValue}>{routeInfo.rate}</Text>
          </View>
          <View style={swapStyles.routeDivider} />
          <View style={swapStyles.routeRow}>
            <Text style={swapStyles.routeLabel}>Network Fee</Text>
            <Text style={swapStyles.routeValue}>{routeInfo.fee}</Text>
          </View>
          <View style={swapStyles.routeDivider} />
          <View style={swapStyles.routeRow}>
            <Text style={swapStyles.routeLabel}>Slippage</Text>
            <Text style={swapStyles.routeValue}>{slippage}</Text>
          </View>
        </View>

        {/* Swap Button */}
        <TouchableOpacity
          style={[swapStyles.swapActionBtn, !fromAmount && { opacity: 0.5 }]}
          onPress={handleSwap}
          disabled={!fromAmount}
          activeOpacity={0.8}
        >
          <Text style={swapStyles.swapActionText}>Swap</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: T.s4,
    paddingTop: 56,
    paddingBottom: T.s4,
  },
  headerTitle: {
    fontFamily: T.fontBold,
    fontSize: 18,
    color: T.ink,
  },
});

const swapStyles = StyleSheet.create({
  card: {
    backgroundColor: T.surface,
    borderRadius: T.radius,
    padding: T.s4,
    marginBottom: T.s5,
  },
  tokenSection: {
    marginBottom: T.s2,
  },
  tokenSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.s2,
  },
  tokenSectionLabel: {
    fontFamily: T.fontFamily,
    fontSize: 12,
    color: T.inkMuted,
  },
  balanceText: {
    fontFamily: T.fontFamily,
    fontSize: 12,
    color: T.accent,
  },
  tokenInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.s3,
  },
  amountInput: {
    flex: 1,
    fontFamily: T.fontBold,
    fontSize: 28,
    color: T.ink,
    paddingVertical: T.s2,
    letterSpacing: -0.5,
  },
  tokenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.bg,
    borderRadius: T.radiusFull,
    paddingVertical: T.s2,
    paddingLeft: T.s2,
    paddingRight: T.s3,
    gap: T.s1,
  },
  tokenDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenInitial: {
    fontFamily: T.fontBold,
    fontSize: 12,
  },
  tokenChipLabel: {
    fontFamily: T.fontSemiBold,
    fontSize: 14,
    color: T.ink,
  },
  chevron: {
    fontSize: 16,
    color: T.inkFaint,
    fontFamily: T.fontFamily,
  },
  swapBtnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: T.s2,
  },
  swapLine: {
    flex: 1,
    height: T.hairline,
    backgroundColor: T.border,
  },
  swapBtn: {
    width: 40,
    height: 40,
    borderRadius: T.radiusFull,
    backgroundColor: T.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: T.s3,
  },
  routeCard: {
    backgroundColor: T.surface,
    borderRadius: T.radius,
    padding: T.s4,
    marginBottom: T.s5,
  },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: T.s2,
  },
  routeLabel: {
    fontFamily: T.fontFamily,
    fontSize: 13,
    color: T.inkMuted,
  },
  routeValue: {
    fontFamily: T.fontSemiBold,
    fontSize: 13,
    color: T.ink,
  },
  routeDivider: {
    height: T.hairline,
    backgroundColor: T.border,
  },
  swapActionBtn: {
    backgroundColor: T.accent,
    paddingVertical: T.s4,
    borderRadius: T.radius,
    alignItems: 'center',
    shadowColor: T.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  swapActionText: {
    fontFamily: T.fontSemiBold,
    fontSize: 16,
    color: T.ink,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface,
    borderRadius: T.radius,
    padding: T.s4,
    marginBottom: T.s2,
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
  balanceVal: {
    fontFamily: T.fontSemiBold,
    fontSize: 15,
    color: T.ink,
  },
});
