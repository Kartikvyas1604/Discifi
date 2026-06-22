import { useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { PublicKey, Keypair } from '@solana/web3.js';
import { T, formatCompact } from '../theme';
import { CloseIcon, ArrowUpIcon } from '../components/Icons';
import { useWallet } from '../services/WalletContext';
import { useNetwork } from '../services/NetworkContext';
import { useWalletData } from '../services/useWalletData';
import { sendSOL, validateAddress, truncateAddress } from '../services/sendService';
import { getMnemonic } from '../services/secureStorage';
import { mnemonicToSeed } from '../crypto/bip39';
import { deriveKeypair } from '../crypto/address';
import { checkAllRules, recordTransaction } from '../services/ruleEngine';
import { walletEvents, EVENTS } from '../services/WalletEvents';

export default function SendScreen({ navigation }: any) {
  const { hotAddress, hotPublicKey } = useWallet();
  const { connection } = useNetwork();
  const { walletData } = useWalletData(hotPublicKey);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'confirm' | 'sending' | 'done'>('input');
  const [txSignature, setTxSignature] = useState('');
  const [error, setError] = useState('');

  const solBalance = walletData.solBalance;
  const solPrice = walletData.tokens.find(t => t.symbol === 'SOL')?.priceUsd || 0;
  const usdValue = parseFloat(amount || '0') * solPrice;
  const amountLamports = Math.floor(parseFloat(amount || '0') * 1e9);

  const handleMaxPress = () => {
    setAmount(solBalance.toFixed(4));
  };

  const handleReview = async () => {
    setError('');
    if (!recipient.trim()) return;
    if (!amount || parseFloat(amount) <= 0) return;
    if (parseFloat(amount) > solBalance) {
      Alert.alert('Insufficient balance', `You only have ${solBalance.toFixed(4)} SOL`);
      return;
    }
    if (!validateAddress(recipient.trim())) {
      setError('This address is not a valid Solana wallet');
      return;
    }

    const rulesCheck = await checkAllRules(usdValue, recipient.trim());
    if (!rulesCheck.allowed) {
      Alert.alert('Rule Blocked', rulesCheck.message || 'Transaction blocked by your covenants');
      return;
    }

    setStep('confirm');
  };

  const handleSend = async () => {
    setStep('sending');
    setError('');
    try {
      const mnemonicStr = await getMnemonic();
      if (!mnemonicStr) throw new Error('Wallet not found');
      const words = mnemonicStr.split(' ');
      const seed = await mnemonicToSeed(words, '');
      const kp = deriveKeypair(seed, "m/44'/501'/0'/0'");
      const sender = Keypair.fromSeed(kp.privateKey);

      const latestBlockhash = await connection.getLatestBlockhash('confirmed');

      const result = await sendSOL({
        connection,
        sender,
        recipient: recipient.trim(),
        amountLamports,
      });

      const confirmation = await connection.confirmTransaction(
        {
          signature: result.signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        'confirmed',
      );

      if (confirmation.value.err) {
        throw new Error('Transaction failed on chain: ' + JSON.stringify(confirmation.value.err));
      }

      await recordTransaction(usdValue, recipient.trim());
      setTxSignature(result.signature);
      setStep('done');

      walletEvents.emit(EVENTS.TRANSACTION_CONFIRMED, {
        signature: result.signature,
        amount: parseFloat(amount),
        token: 'SOL',
        destination: recipient.trim(),
        type: 'send',
      });
      walletEvents.emit(EVENTS.BALANCE_SHOULD_REFRESH);
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
      setStep('confirm');
    }
  };

  if (step === 'sending') {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={T.accent} />
          <Text style={styles.sendingText}>Sending {amount} SOL...</Text>
          <Text style={styles.sendingSubtext}>Confirming on Solana {useNetwork().network}</Text>
        </View>
      </View>
    );
  }

  if (step === 'done') {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <View style={[styles.confirmIcon, { backgroundColor: T.safe + '20' }]}>
            <Text style={{ fontSize: 32, color: T.safe }}>✓</Text>
          </View>
          <Text style={styles.confirmAmount}>Sent {amount} SOL</Text>
          <Text style={styles.confirmUsd}>~${formatCompact(usdValue)}</Text>
          <View style={styles.detailSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>To</Text>
              <Text style={styles.detailValue}>{truncateAddress(recipient)}</Text>
            </View>
            <View style={styles.detailDivider} />
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

          <Text style={styles.confirmAmount}>{amount} SOL</Text>
          <Text style={styles.confirmUsd}>~${formatCompact(usdValue)}</Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.detailSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>To</Text>
              <Text style={styles.detailValue}>{truncateAddress(recipient)}</Text>
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
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setStep('input')} activeOpacity={0.8}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sendConfirmBtn} onPress={handleSend} activeOpacity={0.8}>
              <Text style={styles.sendConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
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
        <Text style={styles.headerTitle}>Send</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: T.s4, paddingBottom: T.s5 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.fieldLabel}>Recipient Address</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, error ? { borderColor: T.danger } : null]}
            placeholder="Enter Solana address"
            placeholderTextColor={T.inkFaint}
            value={recipient}
            onChangeText={(v) => { setRecipient(v); setError(''); }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.pasteBtn} activeOpacity={0.7}>
            <Text style={styles.pasteText}>Paste</Text>
          </TouchableOpacity>
        </View>
        {error ? <Text style={styles.errorHint}>{error}</Text> : null}

        <Text style={styles.fieldLabel}>Amount (SOL)</Text>
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

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>{solBalance.toFixed(4)} SOL</Text>
        </View>

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
  container: { flex: 1, backgroundColor: T.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: T.s4, paddingTop: 56, paddingBottom: T.s4 },
  headerTitle: { fontFamily: T.fontBold, fontSize: 18, color: T.ink },
  fieldLabel: { fontFamily: T.fontFamily, fontSize: 13, color: T.inkMuted, marginBottom: T.s2, marginTop: T.s3 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.surface, borderRadius: T.radius, paddingHorizontal: T.s4 },
  input: { flex: 1, fontFamily: T.fontFamily, fontSize: 15, color: T.ink, paddingVertical: T.s4, borderWidth: 0 },
  pasteBtn: { backgroundColor: T.surfaceElevated, paddingHorizontal: T.s3, paddingVertical: T.s1, borderRadius: T.radiusSm },
  pasteText: { fontFamily: T.fontSemiBold, fontSize: 12, color: T.accentLight },
  errorHint: { fontFamily: T.fontFamily, fontSize: 12, color: T.danger, marginTop: T.s1, marginLeft: T.s1 },
  amountRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.surface, borderRadius: T.radius, paddingLeft: T.s4 },
  amountInput: { flex: 1, fontFamily: T.fontBold, fontSize: 32, color: T.ink, paddingVertical: T.s4, letterSpacing: -0.5 },
  maxBtn: { backgroundColor: T.accent + '20', paddingHorizontal: T.s3, paddingVertical: T.s2, borderRadius: T.radiusSm, marginRight: T.s3 },
  maxText: { fontFamily: T.fontSemiBold, fontSize: 11, color: T.accentLight },
  usdPreview: { fontFamily: T.fontFamily, fontSize: 13, color: T.inkMuted, marginTop: T.s1, marginLeft: T.s1 },
  balanceCard: { backgroundColor: T.surface, borderRadius: T.radius, padding: T.s4, marginTop: T.s4, flexDirection: 'row', justifyContent: 'space-between' },
  balanceLabel: { fontFamily: T.fontFamily, fontSize: 13, color: T.inkMuted },
  balanceValue: { fontFamily: T.fontSemiBold, fontSize: 13, color: T.accent },
  reviewBtn: { backgroundColor: T.accent, paddingVertical: T.s4, borderRadius: T.radius, alignItems: 'center', marginTop: T.s4 },
  reviewBtnDisabled: { backgroundColor: T.surfaceElevated },
  reviewText: { fontFamily: T.fontSemiBold, fontSize: 16, color: T.ink },
  confirmContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: T.s4 },
  confirmIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: T.danger + '20', alignItems: 'center', justifyContent: 'center', marginBottom: T.s4 },
  confirmAmount: { fontFamily: T.fontBold, fontSize: 36, color: T.ink, letterSpacing: -0.5 },
  confirmUsd: { fontFamily: T.fontFamily, fontSize: 16, color: T.inkMuted, marginBottom: T.s6 },
  detailSection: { backgroundColor: T.surface, borderRadius: T.radius, padding: T.s4, width: '100%', marginBottom: T.s6 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: T.s2 },
  detailLabel: { fontFamily: T.fontFamily, fontSize: 13, color: T.inkMuted },
  detailValue: { fontFamily: T.fontSemiBold, fontSize: 13, color: T.ink, maxWidth: '60%' },
  detailDivider: { height: T.hairline, backgroundColor: T.border },
  buttonRow: { flexDirection: 'row', gap: T.s3, width: '100%' },
  cancelBtn: { flex: 1, backgroundColor: T.surfaceElevated, paddingVertical: T.s4, borderRadius: T.radius, alignItems: 'center' },
  cancelText: { fontFamily: T.fontSemiBold, fontSize: 15, color: T.ink },
  sendConfirmBtn: { flex: 1, backgroundColor: T.accent, paddingVertical: T.s4, borderRadius: T.radius, alignItems: 'center' },
  sendConfirmText: { fontFamily: T.fontSemiBold, fontSize: 15, color: T.ink },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: T.s4, gap: T.s4 },
  sendingText: { fontFamily: T.fontSemiBold, fontSize: 18, color: T.ink },
  sendingSubtext: { fontFamily: T.fontFamily, fontSize: 14, color: T.inkMuted },
  errorBanner: { backgroundColor: T.danger + '20', borderRadius: T.radius, padding: T.s3, width: '100%', marginBottom: T.s3 },
  errorText: { fontFamily: T.fontFamily, fontSize: 12, color: T.danger, textAlign: 'center' },
  primaryBtn: { backgroundColor: T.accent, paddingVertical: T.s4, paddingHorizontal: T.s8, borderRadius: T.radius, alignItems: 'center' },
  primaryBtnText: { fontFamily: T.fontSemiBold, fontSize: 16, color: T.ink },
});
