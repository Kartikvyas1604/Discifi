import { useState, useCallback, useRef } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { T, formatCurrency, toRoman } from '../theme';
import { AccentCard } from '../components/AccentCard';
import { Glyph } from '../components/Glyph';

const { width: SCREEN_W } = Dimensions.get('window');

interface Tx {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  flagged: boolean;
}

const MOCK_TXS: Tx[] = [
  { id: '1', merchant: 'Jupiter DEX', amount: -1240, date: '12m', flagged: true },
  { id: '2', merchant: 'Coinbase', amount: 500, date: '1h', flagged: false },
  { id: '3', merchant: 'Magic Eden', amount: -80, date: '3h', flagged: false },
  { id: '4', merchant: 'Uniswap V3', amount: -2450, date: '5h', flagged: true },
  { id: '5', merchant: 'Solend Deposit', amount: 1200, date: '12h', flagged: false },
  { id: '6', merchant: 'Orca LP', amount: -340, date: '1d', flagged: false },
  { id: '7', merchant: 'Drift Protocol', amount: -920, date: '1d', flagged: true },
  { id: '8', merchant: 'Kamino Earn', amount: 2000, date: '2d', flagged: false },
  { id: '9', merchant: 'Meteora DLMM', amount: -150, date: '2d', flagged: false },
  { id: '10', merchant: 'Sanctum', amount: 100, date: '3d', flagged: false },
];

export default function DashboardScreen() {
  const [balance] = useState(42850.75);

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.wordmarkRow}>
          <Text style={styles.wordmark}>DISCIFI</Text>
        </View>

        <View style={styles.heroRow}>
          <View style={{ flex: 2 }}>
            <Text style={styles.portfolioLabel}>PORTFOLIO</Text>
            <Text style={styles.balanceValue}>
              ${formatCurrency(balance)}
            </Text>
          </View>
          <View style={{ flex: 1, gap: T.s2 }}>
            <View>
              <Text style={styles.microLabel}>TODAY</Text>
              <Text style={styles.microValue}>$247</Text>
            </View>
            <View>
              <Text style={styles.microLabel}>WEEK</Text>
              <Text style={styles.microValue}>$1,840</Text>
            </View>
            <View>
              <Text style={styles.microLabel}>MONTH</Text>
              <Text style={styles.microValue}>$6,210</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <AccentCard style={{ marginHorizontal: T.s4, marginBottom: T.s5 }}>
          <View style={{ alignItems: 'center', paddingVertical: T.s2 }}>
            <Text style={styles.disciplineNumeral}>{toRoman(2)}</Text>
            <Text style={styles.disciplineLabel}>DISCIPLINE INDEX</Text>
            <View style={styles.disciplineRules}>
              <View style={styles.disciplineVertRule} />
              <Text style={styles.disciplineQuote}>
                No rule violations in 7 days.
              </Text>
              <View style={styles.disciplineVertRule} />
            </View>
          </View>
        </AccentCard>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT TRANSACTIONS</Text>
        </View>

        <View style={{ paddingHorizontal: T.s4 }}>
          {MOCK_TXS.map((tx) => (
            <TouchableOpacity
              key={tx.id}
              activeOpacity={0.7}
              style={[
                styles.txRow,
                tx.flagged && { borderLeftWidth: 2, borderLeftColor: T.gold, paddingLeft: T.s3 - 2 },
              ]}
            >
              <Text style={styles.txMerchant}>{tx.merchant}</Text>
              <Text style={styles.txDate}>{tx.date}</Text>
              <Text
                style={[
                  styles.txAmount,
                  { color: tx.amount > 0 ? T.safe : T.ink },
                ]}
              >
                {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
              </Text>
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
  wordmarkRow: {
    paddingTop: 60,
    paddingBottom: T.s5,
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: T.fontDisplay,
    fontSize: 12,
    letterSpacing: 6,
    color: T.gold,
  },
  heroRow: {
    flexDirection: 'row',
    paddingHorizontal: T.s4,
    marginBottom: T.s5,
  },
  portfolioLabel: {
    fontFamily: T.fontBody,
    fontSize: 10,
    letterSpacing: 1.5,
    color: T.inkMuted,
    marginBottom: T.s1,
  },
  balanceValue: {
    fontFamily: T.fontFigures,
    fontSize: 52,
    color: T.ink,
    lineHeight: 56,
  },
  microLabel: {
    fontFamily: T.fontBody,
    fontSize: 9,
    letterSpacing: 1,
    color: T.inkMuted,
    marginBottom: 1,
  },
  microValue: {
    fontFamily: T.fontBody,
    fontSize: 14,
    color: T.ink,
  },
  divider: {
    height: T.hairline,
    backgroundColor: T.border,
    marginHorizontal: T.s4,
    marginBottom: T.s5,
  },
  disciplineNumeral: {
    fontFamily: T.fontDisplay,
    fontSize: 72,
    color: T.ink,
    lineHeight: 78,
  },
  disciplineLabel: {
    fontFamily: T.fontBody,
    fontSize: 9,
    letterSpacing: 2,
    color: T.inkMuted,
    marginBottom: T.s2,
  },
  disciplineRules: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.s3,
  },
  disciplineVertRule: {
    width: 1,
    height: 16,
    backgroundColor: T.border,
  },
  disciplineQuote: {
    fontFamily: T.fontFigures,
    fontSize: 12,
    color: T.inkMuted,
    fontStyle: 'italic',
  },
  sectionHeader: {
    paddingHorizontal: T.s4,
    marginBottom: T.s2,
  },
  sectionTitle: {
    fontFamily: T.fontBody,
    fontSize: 9,
    letterSpacing: 2,
    color: T.inkMuted,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: T.s3,
    borderBottomWidth: T.hairline,
    borderBottomColor: T.border,
  },
  txMerchant: {
    flex: 1,
    fontFamily: T.fontBody,
    fontSize: 13,
    color: T.ink,
  },
  txDate: {
    fontFamily: T.fontMono,
    fontSize: 10,
    color: T.inkFaint,
    marginRight: T.s3,
    width: 32,
    textAlign: 'right',
  },
  txAmount: {
    fontFamily: T.fontFigures,
    fontSize: 14,
    minWidth: 80,
    textAlign: 'right',
  },
});
