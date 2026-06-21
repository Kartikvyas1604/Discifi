import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { T } from '../theme';
import MnemonicInput from '../components/MnemonicInput';
import { validateMnemonic, mnemonicToSeed, clearBytes } from '../crypto/bip39';
import { deriveWalletSet } from '../crypto/address';
import type { WalletSet } from '../crypto/types';
import { storeMnemonic, storePubKey } from '../services/secureStorage';

export default function RestoreWalletScreen({ onComplete }: { onComplete: (wallets: WalletSet) => void }) {
  const [wordCount, setWordCount] = useState<12 | 24>(24);
  const [words, setWords] = useState<string[]>(Array(24).fill(''));
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [passphrase, setPassphrase] = useState('');

  const handleWordChange = useCallback((index: number, word: string) => {
    setWords(prev => {
      const next = [...prev];
      next[index] = word.trim();
      return next;
    });
    if (errors[index]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  }, [errors]);

  const handleRestore = useCallback(async () => {
    setGlobalError('');
    const activeWords = words.slice(0, wordCount);
    const emptyIndex = activeWords.findIndex(w => !w || w.length === 0);
    if (emptyIndex !== -1) {
      setErrors(prev => ({ ...prev, [emptyIndex]: 'This field is required' }));
      return;
    }

    if (!validateMnemonic(activeWords)) {
      setGlobalError('Invalid seed phrase — check each word is spelled correctly');
      return;
    }

    setLoading(true);
    try {
      const seed = await mnemonicToSeed(activeWords, passphrase);
      const wallets = deriveWalletSet(seed);
      await storeMnemonic(activeWords.join(' '));
      await storePubKey('hot', wallets.hot.address);
      await storePubKey('vault', wallets.vault.address);
      clearBytes(seed);
      onComplete(wallets);
    } catch (err) {
      setGlobalError('Failed to derive wallets — check your seed phrase');
    } finally {
      setLoading(false);
    }
  }, [words, wordCount, passphrase, onComplete]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Restore Wallet</Text>
        <Text style={styles.headerSub}>
          Enter your {wordCount}-word seed phrase to recover your wallets
        </Text>
      </View>

      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[styles.segment, wordCount === 12 && styles.segmentActive]}
          onPress={() => setWordCount(12)}
        >
          <Text style={[styles.segmentText, wordCount === 12 && styles.segmentTextActive]}>
            12 words
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, wordCount === 24 && styles.segmentActive]}
          onPress={() => setWordCount(24)}
        >
          <Text style={[styles.segmentText, wordCount === 24 && styles.segmentTextActive]}>
            24 words
          </Text>
        </TouchableOpacity>
      </View>

      {globalError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{globalError}</Text>
        </View>
      ) : null}

      <MnemonicInput
        words={words.slice(0, wordCount)}
        onWordChange={handleWordChange}
        wordCount={wordCount}
        errors={errors}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => setShowAdvanced(!showAdvanced)}
        >
          <Text style={styles.linkText}>
            {showAdvanced ? 'Hide' : 'Show'} advanced options
          </Text>
        </TouchableOpacity>

        {showAdvanced && (
          <MnemonicInput
            words={[passphrase]}
            wordCount={12}
            onWordChange={(_, word) => setPassphrase(word)}
          />
        )}

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleRestore}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={T.ink} />
          ) : (
            <Text style={styles.primaryBtnText}>Restore Wallets</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  header: {
    padding: T.s4,
    paddingBottom: T.s4,
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
  },
  segmentRow: {
    flexDirection: 'row',
    paddingHorizontal: T.s4,
    gap: T.s2,
    marginBottom: T.s3,
  },
  segment: {
    flex: 1,
    paddingVertical: T.s2,
    borderRadius: T.radius,
    backgroundColor: T.surface,
    alignItems: 'center',
    borderWidth: T.hairline,
    borderColor: T.border,
  },
  segmentActive: {
    backgroundColor: T.accent + '20',
    borderColor: T.accent,
  },
  segmentText: {
    fontFamily: T.fontSemiBold,
    fontSize: 14,
    color: T.inkMuted,
  },
  segmentTextActive: {
    color: T.accent,
  },
  errorBanner: {
    marginHorizontal: T.s4,
    marginBottom: T.s2,
    backgroundColor: T.danger + '20',
    borderRadius: T.radius,
    padding: T.s3,
    borderWidth: T.hairline,
    borderColor: T.danger,
  },
  errorBannerText: {
    fontFamily: T.fontFamily,
    fontSize: 13,
    color: T.danger,
    textAlign: 'center',
  },
  footer: {
    padding: T.s4,
    paddingBottom: T.s5,
    gap: T.s3,
  },
  linkBtn: {
    alignSelf: 'center',
  },
  linkText: {
    fontFamily: T.fontSemiBold,
    fontSize: 14,
    color: T.accent,
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
});
