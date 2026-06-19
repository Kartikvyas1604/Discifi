import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  AppState,
  Platform,
} from 'react-native';
import { T } from '../theme';

const AUTO_HIDE_MS = 5 * 60 * 1000;

interface Props {
  words: string[];
  onTimeout?: () => void;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export default function SecureMnemonicDisplay({ words, onTimeout }: Props) {
  const [hidden, setHidden] = useState(false);
  const [timeLeft, setTimeLeft] = useState(AUTO_HIDE_MS);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) {
          setHidden(true);
          onTimeout?.();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTimeout]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        setHidden(true);
      }
    });
    return () => sub.remove();
  }, []);

  const resetTimer = useCallback(() => {
    setTimeLeft(AUTO_HIDE_MS);
    setHidden(false);
  }, []);

  if (hidden) {
    return (
      <View style={styles.container}>
        <View style={styles.hiddenContainer}>
          <Text style={styles.hiddenText}>Your seed phrase is hidden</Text>
          <Text style={styles.hiddenSubtext}>
            Tap the screen and re-authenticate to view
          </Text>
        </View>
      </View>
    );
  }

  const chunks = chunkArray(words, 4);

  return (
    <View style={styles.container}>
      <View
        style={styles.secureOverlay}
        onTouchEnd={resetTimer}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {chunks.map((chunk, ci) => (
            <View key={ci} style={styles.wordRow}>
              {chunk.map((word, wi) => {
                const globalIdx = ci * 4 + wi + 1;
                return (
                  <View key={wi} style={styles.wordChip}>
                    <Text style={styles.wordIndex}>{globalIdx}</Text>
                    <Text style={styles.wordText}>{word}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
        <Text style={styles.warning}>
          These 24 words are the ONLY way to recover your wallet.
          {'\n'}DisciFi never stores them and cannot recover them if lost.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  secureOverlay: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: T.s4,
    gap: T.s3,
  },
  wordRow: {
    flexDirection: 'row',
    gap: T.s2,
    justifyContent: 'center',
  },
  wordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surfaceElevated,
    borderRadius: T.radius,
    paddingHorizontal: T.s2,
    paddingVertical: T.s1 + 2,
    gap: T.s1,
    minWidth: 80,
  },
  wordIndex: {
    fontFamily: T.fontFamily,
    fontSize: 11,
    color: T.inkFaint,
    minWidth: 16,
    textAlign: 'right',
  },
  wordText: {
    fontFamily: T.fontSemiBold,
    fontSize: 15,
    color: T.ink,
    letterSpacing: 0.3,
  },
  warning: {
    fontFamily: T.fontFamily,
    fontSize: 13,
    color: T.warning,
    textAlign: 'center',
    padding: T.s4,
    lineHeight: 20,
  },
  hiddenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: T.s4,
  },
  hiddenText: {
    fontFamily: T.fontSemiBold,
    fontSize: 18,
    color: T.ink,
    marginBottom: T.s2,
  },
  hiddenSubtext: {
    fontFamily: T.fontFamily,
    fontSize: 14,
    color: T.inkMuted,
    textAlign: 'center',
  },
});
