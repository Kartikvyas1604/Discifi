import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { T } from '../theme';
import SecureMnemonicDisplay from '../components/SecureMnemonicDisplay';
import MnemonicInput from '../components/MnemonicInput';
import { generateMnemonic, mnemonicToSeed, clearBytes } from '../crypto/bip39';
import { deriveWalletSet } from '../crypto/address';
import type { WalletSet } from '../crypto/types';

type Step = 'intro' | 'generate' | 'verify' | 'wallets' | 'complete';

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function GenerateWalletScreen({ onComplete }: { onComplete: (wallets: WalletSet) => void }) {
  const [step, setStep] = useState<Step>('intro');
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [entropy, setEntropy] = useState<Uint8Array | null>(null);
  const [wallets, setWallets] = useState<WalletSet | null>(null);
  const [loading, setLoading] = useState(false);

  const [verifyIndices] = useState(() => {
    const indices: number[] = [];
    while (indices.length < 6) {
      const idx = Math.floor(Math.random() * 24);
      if (!indices.includes(idx)) indices.push(idx);
    }
    return shuffleArray(indices);
  });

  const [verifyWords, setVerifyWords] = useState<string[]>(Array(24).fill(''));
  const [verifyErrors, setVerifyErrors] = useState<Record<number, string>>({});

  const [passphrase, setPassphrase] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    try {
      const result = await generateMnemonic(256);
      setMnemonic(result.mnemonic);
      setEntropy(result.entropy);
      setStep('generate');
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVerify = useCallback(async () => {
    const errors: Record<number, string> = {};
    for (const idx of verifyIndices) {
      if (verifyWords[idx] !== mnemonic[idx]) {
        errors[idx] = `Expected: ${mnemonic[idx]}`;
      }
    }

    setVerifyErrors(errors);

    if (Object.keys(errors).length === 0) {
      setLoading(true);
      try {
        const seed = await mnemonicToSeed(mnemonic, passphrase);
        const derived = deriveWalletSet(seed);
        setWallets(derived);

        clearBytes(seed);

        if (entropy) clearBytes(entropy);

        setStep('wallets');
      } catch (err) {
        console.error('Derivation failed:', err);
      } finally {
        setLoading(false);
      }
    }
  }, [verifyWords, mnemonic, verifyIndices, passphrase, entropy]);

  const handleConfirm = useCallback(() => {
    if (wallets) {
      const wordsCopy = [...mnemonic];
      setMnemonic([]);
      wordsCopy.fill('');
      onComplete(wallets);
    }
  }, [wallets, mnemonic, onComplete]);

  if (step === 'intro') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Create Your Wallet</Text>
          <Text style={styles.subtitle}>
            DisciFi will generate a 24-word seed phrase that is the master key to all your wallets.
          </Text>

          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>⚠️ Important</Text>
            <Text style={styles.warningText}>
              Write down these 24 words in order and store them securely offline.
              {'\n\n'}DisciFi never stores your seed phrase and cannot recover it.
              {'\n\n'}Anyone with these words controls your funds — never share them.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>What you get:</Text>
            <Text style={styles.infoItem}>• Main spending wallet (daily use)</Text>
            <Text style={styles.infoItem}>• Vault cold wallet (long-term storage)</Text>
            <Text style={styles.infoItem}>• DAO governance voting wallet</Text>
            <Text style={styles.infoItem}>• Stealth spend and view wallets</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleGenerate}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={T.ink} />
            ) : (
              <Text style={styles.primaryBtnText}>Generate Seed Phrase</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (step === 'generate') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Seed Phrase</Text>
          <Text style={styles.headerSub}>Write these 24 words down in order</Text>
        </View>
        <SecureMnemonicDisplay
          words={mnemonic}
          onTimeout={() => setStep('intro')}
        />
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setStep('verify')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>I've Written Them Down</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 'verify') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Verify Your Seed Phrase</Text>
          <Text style={styles.headerSub}>
            Enter the words at the requested positions to confirm you recorded them correctly
          </Text>
        </View>

        <ScrollView style={styles.verifyScroll} contentContainerStyle={styles.verifyContent}>
          <View style={styles.verifyGrid}>
            {verifyIndices.map((origIdx, displayIdx) => (
              <View key={displayIdx} style={styles.verifyRow}>
                <Text style={styles.verifyLabel}>
                  Word #{origIdx + 1}
                </Text>
                <TextInput
                  style={[
                    styles.verifyInput,
                    verifyErrors[origIdx] && styles.verifyInputError,
                  ]}
                  value={verifyWords[origIdx] || ''}
                  onChangeText={word => {
                    const copy = [...verifyWords];
                    copy[origIdx] = word;
                    setVerifyWords(copy);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="type the word"
                  placeholderTextColor={T.inkFaint}
                />
                {verifyErrors[origIdx] && (
                  <Text style={styles.verifyErrorText}>
                    {verifyErrors[origIdx]}
                  </Text>
                )}
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => setShowAdvanced(!showAdvanced)}
          >
            <Text style={styles.linkText}>
              {showAdvanced ? 'Hide' : 'Show'} advanced options
            </Text>
          </TouchableOpacity>

          {showAdvanced && (
            <View style={styles.advancedRow}>
              <Text style={styles.verifyLabel}>
                BIP39 Passphrase (optional)
              </Text>
              <TextInput
                style={styles.verifyInput}
                value={passphrase}
                onChangeText={v => setPassphrase(v)}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                spellCheck={false}
                placeholder="passphrase"
                placeholderTextColor={T.inkFaint}
              />
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={T.ink} />
            ) : (
              <Text style={styles.primaryBtnText}>Verify & Generate Wallets</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 'wallets' && wallets) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Your Wallets Are Ready</Text>
          <Text style={styles.subtitle}>
            These addresses are derived from your seed phrase. Verify them on Solana Explorer.
          </Text>

          <View style={styles.addressCard}>
            <Text style={styles.addressLabel}>🔥 Hot Wallet</Text>
            <Text style={styles.addressValue}>{wallets.hot.address}</Text>
          </View>

          <View style={styles.addressCard}>
            <Text style={styles.addressLabel}>🏦 Vault Wallet</Text>
            <Text style={styles.addressValue}>{wallets.vault.address}</Text>
          </View>

          <View style={styles.addressCard}>
            <Text style={styles.addressLabel}>🗳️ DAO Wallet</Text>
            <Text style={styles.addressValue}>{wallets.dao.address}</Text>
          </View>

          <View style={styles.addressCard}>
            <Text style={styles.addressLabel}>🕵️ Stealth Spend</Text>
            <Text style={styles.addressValue}>{wallets.stealthSpend.address}</Text>
          </View>

          <View style={styles.addressCard}>
            <Text style={styles.addressLabel}>👁️ Stealth View</Text>
            <Text style={styles.addressValue}>{wallets.stealthView.address}</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Enter the Ledger</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  content: {
    padding: T.s4,
    gap: T.s4,
    paddingBottom: 40,
  },
  header: {
    padding: T.s4,
    paddingBottom: T.s2,
  },
  headerTitle: {
    fontFamily: T.fontBold,
    fontSize: 22,
    color: T.ink,
    marginBottom: T.s1,
  },
  headerSub: {
    fontFamily: T.fontFamily,
    fontSize: 14,
    color: T.inkMuted,
    lineHeight: 20,
  },
  title: {
    fontFamily: T.fontBold,
    fontSize: 24,
    color: T.ink,
    marginBottom: T.s2,
  },
  subtitle: {
    fontFamily: T.fontFamily,
    fontSize: 15,
    color: T.inkMuted,
    lineHeight: 22,
  },
  warningCard: {
    backgroundColor: T.warning + '15',
    borderRadius: T.radius,
    padding: T.s4,
    borderWidth: 1,
    borderColor: T.warning + '30',
  },
  warningTitle: {
    fontFamily: T.fontBold,
    fontSize: 16,
    color: T.warning,
    marginBottom: T.s2,
  },
  warningText: {
    fontFamily: T.fontFamily,
    fontSize: 14,
    color: T.ink,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: T.surface,
    borderRadius: T.radius,
    padding: T.s4,
  },
  infoTitle: {
    fontFamily: T.fontSemiBold,
    fontSize: 15,
    color: T.ink,
    marginBottom: T.s2,
  },
  infoItem: {
    fontFamily: T.fontFamily,
    fontSize: 14,
    color: T.inkMuted,
    lineHeight: 24,
  },
  primaryBtn: {
    backgroundColor: T.accent,
    borderRadius: T.radius,
    paddingVertical: T.s4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryBtnText: {
    fontFamily: T.fontBold,
    fontSize: 16,
    color: T.ink,
  },
  footer: {
    padding: T.s4,
    paddingBottom: 40,
  },
  verifyScroll: {
    flex: 1,
  },
  verifyContent: {
    padding: T.s4,
    gap: T.s4,
  },
  verifyGrid: {
    gap: T.s3,
  },
  verifyRow: {
    gap: T.s1,
  },
  verifyInput: {
    fontFamily: T.fontFamily,
    fontSize: 16,
    color: T.ink,
    backgroundColor: T.surface,
    borderRadius: T.radius,
    paddingHorizontal: T.s3,
    paddingVertical: 10,
    borderWidth: T.hairline,
    borderColor: T.border,
  },
  verifyInputError: {
    borderColor: T.danger,
  },
  verifyErrorText: {
    fontFamily: T.fontFamily,
    fontSize: 12,
    color: T.danger,
  },
  verifyLabel: {
    fontFamily: T.fontSemiBold,
    fontSize: 14,
    color: T.accent,
  },
  advancedRow: {
    gap: T.s1,
  },
  linkBtn: {
    alignSelf: 'center',
  },
  linkText: {
    fontFamily: T.fontSemiBold,
    fontSize: 14,
    color: T.accent,
  },
  addressCard: {
    backgroundColor: T.surface,
    borderRadius: T.radius,
    padding: T.s4,
    borderWidth: T.hairline,
    borderColor: T.border,
  },
  addressLabel: {
    fontFamily: T.fontSemiBold,
    fontSize: 13,
    color: T.inkMuted,
    marginBottom: T.s1,
  },
  addressValue: {
    fontFamily: T.fontMono,
    fontSize: 13,
    color: T.ink,
    letterSpacing: 0.5,
  },
});
