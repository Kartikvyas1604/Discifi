import { useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { T } from '../theme';
import { AccentCard } from '../components/AccentCard';
import { GoldToggle } from '../components/GoldToggle';

interface Rule {
  id: string;
  type: string;
  value: string;
  scope: string;
  active: boolean;
  lastTriggered: string;
}

const MOCK_RULES: Rule[] = [
  { id: '1', type: 'DAILY LIMIT', value: '$800', scope: 'All categories', active: true, lastTriggered: '2d ago' },
  { id: '2', type: 'MAX PER TX', value: '$250', scope: 'All tokens', active: true, lastTriggered: '5d ago' },
  { id: '3', type: 'ALLOWLIST', value: '8 contracts', scope: 'DeFi only', active: true, lastTriggered: 'Never' },
  { id: '4', type: 'MIN HOLD', value: '24 hours', scope: 'New positions', active: false, lastTriggered: '—' },
  { id: '5', type: 'AUTO-SAVE', value: '15%', scope: 'Incoming transfers', active: true, lastTriggered: '1h ago' },
];

export default function RulesScreen() {
  const [rules, setRules] = useState(MOCK_RULES);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>YOUR COVENANTS</Text>
        <Text style={styles.subtitle}>{rules.filter(r => r.active).length} ACTIVE</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {rules.map((rule, i) => (
          <AccentCard
            key={rule.id}
            accentColor={rule.active ? T.gold : T.border}
            style={[
              styles.ruleCard,
            ]}
          >
            <View style={styles.ruleTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ruleType}>{rule.type}</Text>
                <Text style={styles.ruleValue}>{rule.value}</Text>
                <Text style={styles.ruleScope}>{rule.scope}</Text>
              </View>
              <GoldToggle active={rule.active} onToggle={() => toggleRule(rule.id)} />
            </View>
            <View style={styles.ruleDivider} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.ruleMeta}>Last triggered</Text>
              <Text style={styles.ruleMetaValue}>{rule.lastTriggered}</Text>
            </View>
          </AccentCard>
        ))}

        <TouchableOpacity style={styles.addCard} activeOpacity={0.7}>
          <Text style={styles.addGlyph}>+</Text>
          <Text style={styles.addText}>NEW COVENANT</Text>
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
    paddingHorizontal: T.s4,
    paddingTop: 60,
    marginBottom: T.s5,
  },
  title: {
    fontFamily: T.fontDisplay,
    fontSize: 28,
    color: T.ink,
    marginBottom: T.s1,
  },
  subtitle: {
    fontFamily: T.fontMono,
    fontSize: 11,
    color: T.gold,
    letterSpacing: 1,
  },
  ruleCard: {
    marginHorizontal: T.s4,
    marginBottom: T.s3,
  },
  ruleTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ruleType: {
    fontFamily: T.fontBody,
    fontSize: 9,
    letterSpacing: 2,
    color: T.inkMuted,
    marginBottom: 2,
  },
  ruleValue: {
    fontFamily: T.fontFigures,
    fontSize: 32,
    color: T.ink,
    lineHeight: 36,
    marginBottom: 2,
  },
  ruleScope: {
    fontFamily: T.fontBody,
    fontSize: 11,
    color: T.inkMuted,
  },
  ruleDivider: {
    height: T.hairline,
    backgroundColor: T.border,
    marginVertical: T.s2,
  },
  ruleMeta: {
    fontFamily: T.fontMono,
    fontSize: 10,
    color: T.inkFaint,
  },
  ruleMetaValue: {
    fontFamily: T.fontMono,
    fontSize: 10,
    color: T.inkMuted,
  },
  addCard: {
    marginHorizontal: T.s4,
    borderWidth: 1,
    borderColor: T.border,
    borderStyle: 'dashed',
    padding: T.s5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: T.s2,
  },
  addGlyph: {
    fontFamily: T.fontBody,
    fontSize: 16,
    color: T.gold,
  },
  addText: {
    fontFamily: T.fontBody,
    fontSize: 11,
    letterSpacing: 2,
    color: T.gold,
  },
});
