import { useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { T, formatCompact } from '../theme';
import { CloseIcon, SearchIcon, ArrowUpIcon, SparklesIcon } from '../components/Icons';

interface Token {
  symbol: string;
  name: string;
  balance: number;
  value: number;
  color: string;
}

const MOCK_TOKENS: Token[] = [
  { symbol: 'SOL', name: 'Solana', balance: 142.5, value: 28425.00, color: '#9945FF' },
  { symbol: 'USDC', name: 'USD Coin', balance: 8420.50, value: 8420.50, color: '#2775CA' },
  { symbol: 'JUP', name: 'Jupiter', balance: 1250, value: 3125.00, color: '#F7931A' },
  { symbol: 'BONK', name: 'Bonk', balance: 12500000, value: 2880.25, color: '#FFD60A' },
];

export default function SendScreen({ navigation }: any) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<Token>(MOCK_TOKENS[0]);
  const [showTokenPicker, setShowTokenPicker] = useState(false);
  const [step, setStep] = useState<'input' | 'confirm'>('input');

  const handleMaxPress = () => {
    setAmount(selectedToken.balance.toString());
  };

  const handleReview = () => {
    if (!recipient.trim()) return;
    if (!amount || parseFloat(amount) <= 0) return;
    if (parseFloat(amount) > selectedToken.balance) {
      Alert.alert('Insufficient balance', `You only have ${selectedToken.balance} ${selectedToken.symbol}`);
      return;
    }
    setStep('confirm');
  };

  const handleSend = () => {
    setStep('input');
    setRecipient('');
    setAmount('');
  };

  const usdValue = parseFloat(amount || '0') * (selectedToken.value / selectedToken.balance);

  if (step === 'confirm') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('input')} activeOpacity={0.7}>
            <CloseIcon size={24} color={T.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Send</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.confirmContent}>
          <View style={styles.confirmIcon}>
            <ArrowUpIcon size={32} color={T.danger} />
          </View>

          <Text style={styles.confirmAmount}>
            {amount} {selectedToken.symbol}
          </Text>
          <Text style={styles.confirmUsd}>~${formatCompact(usdValue)}</Text>

          <View style={styles.detailSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>To</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {recipient.slice(0, 6)}...{recipient.slice(-4)}
              </Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Network</Text>
              <Text style={styles.detailValue}>Solana</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Network Fee</Text>
              <Text style={styles.detailValue}>~0.000005 SOL</Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setStep('input')}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sendConfirmBtn}
              onPress={handleSend}
              activeOpacity={0.8}
            >
              <Text style={styles.sendConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (showTokenPicker) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowTokenPicker(false)} activeOpacity={0.7}>
            <CloseIcon size={24} color={T.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Token</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: T.s4 }}>
          {MOCK_TOKENS.map((token) => (
            <TouchableOpacity
              key={token.symbol}
              style={[styles.tokenRow, selectedToken.symbol === token.symbol && styles.tokenRowActive]}
              onPress={() => { setSelectedToken(token); setShowTokenPicker(false); }}
              activeOpacity={0.7}
            >
              <View style={[styles.tokenDot, { backgroundColor: token.color + '20' }]}>
                <Text style={[styles.tokenInitial, { color: token.color }]}>{token.symbol[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tokenSymbol}>{token.symbol}</Text>
                <Text style={styles.tokenName}>{token.name}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.tokenValue}>{token.balance}</Text>
                <Text style={styles.tokenUsdValue}>${formatCompact(token.value)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <CloseIcon size={24} color={T.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: T.s4, paddingBottom: T.s5 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Recipient */}
        <Text style={styles.fieldLabel}>Recipient Address</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Enter Solana address"
            placeholderTextColor={T.inkFaint}
            value={recipient}
            onChangeText={setRecipient}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.pasteBtn} activeOpacity={0.7}>
            <Text style={styles.pasteText}>Paste</Text>
          </TouchableOpacity>
        </View>

        {/* Amount */}
        <Text style={styles.fieldLabel}>Amount</Text>
        <View style={styles.amountRow}>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={T.inkFaint}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity style={styles.maxBtn} onPress={handleMaxPress} activeOpacity={0.7}>
            <Text style={styles.maxText}>MAX</Text>
          </TouchableOpacity>
        </View>

        {amount ? (
          <Text style={styles.usdPreview}>~${formatCompact(usdValue)}</Text>
        ) : null}

        {/* Token Selector */}
        <TouchableOpacity
          style={styles.tokenSelector}
          onPress={() => setShowTokenPicker(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.tokenDot, { backgroundColor: selectedToken.color + '20' }]}>
            <Text style={[styles.tokenInitial, { color: selectedToken.color }]}>
              {selectedToken.symbol[0]}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tokenSymbol}>{selectedToken.symbol}</Text>
            <Text style={styles.tokenName}>Balance: {selectedToken.balance}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Review Button */}
        <TouchableOpacity
          style={[
            styles.reviewBtn,
            (!recipient.trim() || !amount) && styles.reviewBtnDisabled,
          ]}
          onPress={handleReview}
          disabled={!recipient.trim() || !amount}
          activeOpacity={0.8}
        >
          <Text style={[styles.reviewText, (!recipient.trim() || !amount) && { color: T.inkFaint }]}>
            Review
          </Text>
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
  fieldLabel: {
    fontFamily: T.fontFamily,
    fontSize: 13,
    color: T.inkMuted,
    marginBottom: T.s2,
    marginTop: T.s3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface,
    borderRadius: T.radius,
    paddingHorizontal: T.s4,
  },
  input: {
    flex: 1,
    fontFamily: T.fontFamily,
    fontSize: 15,
    color: T.ink,
    paddingVertical: T.s4,
  },
  pasteBtn: {
    backgroundColor: T.surfaceElevated,
    paddingHorizontal: T.s3,
    paddingVertical: T.s1,
    borderRadius: T.radiusSm,
  },
  pasteText: {
    fontFamily: T.fontSemiBold,
    fontSize: 12,
    color: T.accentLight,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface,
    borderRadius: T.radius,
    paddingLeft: T.s4,
  },
  amountInput: {
    flex: 1,
    fontFamily: T.fontBold,
    fontSize: 32,
    color: T.ink,
    paddingVertical: T.s4,
    letterSpacing: -0.5,
  },
  maxBtn: {
    backgroundColor: T.accent + '20',
    paddingHorizontal: T.s3,
    paddingVertical: T.s2,
    borderRadius: T.radiusSm,
    marginRight: T.s3,
  },
  maxText: {
    fontFamily: T.fontSemiBold,
    fontSize: 11,
    color: T.accentLight,
  },
  usdPreview: {
    fontFamily: T.fontFamily,
    fontSize: 13,
    color: T.inkMuted,
    marginTop: T.s1,
    marginLeft: T.s1,
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface,
    borderRadius: T.radius,
    padding: T.s4,
    marginTop: T.s5,
  },
  tokenDot: {
    width: 40,
    height: 40,
    borderRadius: T.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: T.s3,
  },
  tokenInitial: {
    fontFamily: T.fontBold,
    fontSize: 16,
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
    marginTop: T.s1,
  },
  chevron: {
    fontSize: 22,
    color: T.inkFaint,
    fontFamily: T.fontFamily,
  },
  reviewBtn: {
    backgroundColor: T.accent,
    paddingVertical: T.s4,
    borderRadius: T.radius,
    alignItems: 'center',
    marginTop: T.s4,
    shadowColor: T.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  reviewBtnDisabled: {
    backgroundColor: T.surfaceElevated,
    shadowOpacity: 0,
    elevation: 0,
  },
  reviewText: {
    fontFamily: T.fontSemiBold,
    fontSize: 16,
    color: T.ink,
  },
  confirmContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: T.s4,
  },
  confirmIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: T.danger + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: T.s4,
  },
  confirmAmount: {
    fontFamily: T.fontBold,
    fontSize: 36,
    color: T.ink,
    letterSpacing: -0.5,
  },
  confirmUsd: {
    fontFamily: T.fontFamily,
    fontSize: 16,
    color: T.inkMuted,
    marginBottom: T.s6,
  },
  detailSection: {
    backgroundColor: T.surface,
    borderRadius: T.radius,
    padding: T.s4,
    width: '100%',
    marginBottom: T.s6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: T.s2,
  },
  detailLabel: {
    fontFamily: T.fontFamily,
    fontSize: 13,
    color: T.inkMuted,
  },
  detailValue: {
    fontFamily: T.fontSemiBold,
    fontSize: 13,
    color: T.ink,
    maxWidth: '60%',
  },
  detailDivider: {
    height: T.hairline,
    backgroundColor: T.border,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: T.s3,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: T.surfaceElevated,
    paddingVertical: T.s4,
    borderRadius: T.radius,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: T.fontSemiBold,
    fontSize: 15,
    color: T.ink,
  },
  sendConfirmBtn: {
    flex: 1,
    backgroundColor: T.accent,
    paddingVertical: T.s4,
    borderRadius: T.radius,
    alignItems: 'center',
  },
  sendConfirmText: {
    fontFamily: T.fontSemiBold,
    fontSize: 15,
    color: T.ink,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface,
    borderRadius: T.radius,
    padding: T.s4,
    marginBottom: T.s2,
  },
  tokenRowActive: {
    borderWidth: 1,
    borderColor: T.accent,
  },
  tokenValue: {
    fontFamily: T.fontSemiBold,
    fontSize: 15,
    color: T.ink,
  },
  tokenUsdValue: {
    fontFamily: T.fontFamily,
    fontSize: 12,
    color: T.inkMuted,
  },
});
