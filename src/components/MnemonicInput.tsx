import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { T } from '../theme';

interface Props {
  words: string[];
  onWordChange: (index: number, word: string) => void;
  wordCount: 12 | 24;
  errors?: Record<number, string>;
}

export default function MnemonicInput({ words, onWordChange, wordCount, errors }: Props) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const getSuggestions = useCallback((input: string): string[] => {
    if (!input) return [];
    const lower = input.toLowerCase();
    return wordlist
      .filter(w => w.startsWith(lower))
      .slice(0, 5);
  }, []);

  const handleSuggestionTap = useCallback((index: number, word: string) => {
    onWordChange(index, word);
    if (index < wordCount - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [onWordChange, wordCount]);

  const handleKeyPress = useCallback((index: number, key: string) => {
    if (key === 'Backspace' && !words[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [words]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {Array.from({ length: wordCount }, (_, i) => {
        const suggestions = focusedIndex === i ? getSuggestions(words[i] || '') : [];

        return (
          <View key={i} style={styles.wordRow}>
            <Text style={styles.wordIndex}>{i + 1}.</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={ref => { inputRefs.current[i] = ref; }}
                style={[
                  styles.input,
                  focusedIndex === i && styles.inputFocused,
                  errors?.[i] && styles.inputError,
                ]}
                value={words[i] || ''}
                onChangeText={v => onWordChange(i, v)}
                onFocus={() => setFocusedIndex(i)}
                onBlur={() => setFocusedIndex(null)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                spellCheck={false}
                placeholder="word"
                placeholderTextColor={T.inkFaint}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => {
                  if (i < wordCount - 1) {
                    inputRefs.current[i + 1]?.focus();
                  }
                }}
              />
              {errors?.[i] && (
                <Text style={styles.errorText}>{errors[i]}</Text>
              )}
              {suggestions.length > 0 && (
                <View style={styles.suggestions}>
                  {suggestions.map(word => (
                    <TouchableOpacity
                      key={word}
                      style={[
                        styles.suggestion,
                        words[i] === word && styles.suggestionActive,
                      ]}
                      onPress={() => handleSuggestionTap(i, word)}
                    >
                      <Text style={[
                        styles.suggestionText,
                        words[i] === word && styles.suggestionTextActive,
                      ]}>
                        {word}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: T.s4,
    gap: T.s2,
    paddingBottom: 40,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: T.s2,
  },
  wordIndex: {
    fontFamily: T.fontSemiBold,
    fontSize: 14,
    color: T.inkMuted,
    width: 28,
    textAlign: 'right',
    marginTop: 12,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  input: {
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
  inputFocused: {
    borderColor: T.accent,
    backgroundColor: T.surfaceElevated,
  },
  inputError: {
    borderColor: T.danger,
  },
  errorText: {
    fontFamily: T.fontFamily,
    fontSize: 11,
    color: T.danger,
    marginTop: 2,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: T.s1,
    marginTop: 4,
  },
  suggestion: {
    backgroundColor: T.surfaceElevated,
    borderRadius: T.radiusSmall,
    paddingHorizontal: T.s2,
    paddingVertical: T.s1,
    borderWidth: T.hairline,
    borderColor: T.border,
  },
  suggestionActive: {
    backgroundColor: T.accent + '30',
    borderColor: T.accent,
  },
  suggestionText: {
    fontFamily: T.fontFamily,
    fontSize: 13,
    color: T.inkMuted,
  },
  suggestionTextActive: {
    color: T.accent,
    fontFamily: T.fontSemiBold,
  },
});
