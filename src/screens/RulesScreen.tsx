import { useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { T } from '../theme';
import { ShieldIcon, PlusIcon } from '../components/Icons';

interface Rule {
  id: string;
  type: string;
  value: string;
  scope: string;
  active: boolean;
  lastTriggered: string;
  description: string;
}

const MOCK_RULES: Rule[] = [
  { id: '1', type: 'Daily Limit', value: '$800', scope: 'All categories', active: true, lastTriggered: '2d ago', description: 'Max spend per day across all protocols' },
  { id: '2', type: 'Max Per Tx', value: '$250', scope: 'All tokens', active: true, lastTriggered: '5d ago', description: 'Single transaction cap' },
  { id: '3', type: 'Allowlist', value: '8 contracts', scope: 'DeFi only', active: true, lastTriggered: 'Never', description: 'Only pre-approved contracts' },
  { id: '4', type: 'Min Hold', value: '24 hours', scope: 'New positions', active: false, lastTriggered: '—', description: 'Minimum hold time before selling' },
  { id: '5', type: 'Auto-Save', value: '15%', scope: 'Incoming transfers', active: true, lastTriggered: '1h ago', description: 'Auto-convert incoming to USDC' },
];

export default function RulesScreen() {
  const [rules, setRules] = useState(MOCK_RULES);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerIcon}>
              <ShieldIcon size={22} color={T.accentLight} />
            </View>
            <Text style={styles.title}>Covenants</Text>
          </View>
          <Text style={styles.subtitle}>
            {rules.filter(r => r.active).length} of {rules.length} rules active
          </Text>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>$800</Text>
              <Text style={styles.summaryLabel}>Daily Limit</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>15%</Text>
              <Text style={styles.summaryLabel}>Auto-Save</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>8</Text>
              <Text style={styles.summaryLabel}>Allowlisted</Text>
            </View>
          </View>
        </View>

        {/* Rules List */}
        <View style={styles.rulesSection}>
          {rules.map((rule) => (
            <View
              key={rule.id}
              style={[styles.ruleCard, !rule.active && styles.ruleCardInactive]}
            >
              <View style={styles.ruleTop}>
                <View style={styles.ruleInfo}>
                  <Text style={[styles.ruleType, !rule.active && { color: T.inkFaint }]}>
                    {rule.type}
                  </Text>
                  <Text style={[styles.ruleValue, !rule.active && { color: T.inkFaint }]}>
                    {rule.value}
                  </Text>
                  <Text style={styles.ruleDesc}>{rule.description}</Text>
                </View>
                <View style={styles.toggleSection}>
                  <Text style={styles.ruleScope}>{rule.scope}</Text>
                  <Switch
                    value={rule.active}
                    onValueChange={() => toggleRule(rule.id)}
                    trackColor={{ false: T.surfaceElevated, true: T.accent + '60' }}
                    thumbColor={rule.active ? T.accent : T.inkFaint}
                  />
                </View>
              </View>
              <View style={styles.ruleBottom}>
                <Text style={styles.ruleMeta}>Last triggered</Text>
                <Text style={[styles.ruleMetaValue, !rule.active && { color: T.inkFaint }]}>
                  {rule.lastTriggered}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Add Rule Button */}
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
          <PlusIcon size={18} color={T.accent} />
          <Text style={styles.addText}>New Covenant</Text>
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
    paddingTop: 56,
    marginBottom: T.s5,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.s3,
    marginBottom: T.s1,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: T.radiusFull,
    backgroundColor: T.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: T.fontBold,
    fontSize: 28,
    color: T.ink,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: T.fontFamily,
    fontSize: 14,
    color: T.inkMuted,
    marginLeft: 44,
  },
  summaryCard: {
    marginHorizontal: T.s4,
    backgroundColor: T.surface,
    borderRadius: T.radius,
    padding: T.s4,
    marginBottom: T.s5,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: T.border,
  },
  summaryValue: {
    fontFamily: T.fontBold,
    fontSize: 22,
    color: T.ink,
    letterSpacing: -0.5,
  },
  summaryLabel: {
    fontFamily: T.fontFamily,
    fontSize: 11,
    color: T.inkMuted,
    marginTop: 2,
  },
  rulesSection: {
    paddingHorizontal: T.s4,
    gap: T.s3,
  },
  ruleCard: {
    backgroundColor: T.surface,
    borderRadius: T.radius,
    padding: T.s4,
    borderWidth: 1,
    borderColor: T.accent + '20',
  },
  ruleCardInactive: {
    borderColor: T.border,
    opacity: 0.7,
  },
  ruleTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ruleInfo: {
    flex: 1,
    marginRight: T.s3,
  },
  ruleType: {
    fontFamily: T.fontFamily,
    fontSize: 11,
    color: T.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  ruleValue: {
    fontFamily: T.fontBold,
    fontSize: 28,
    color: T.ink,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  ruleDesc: {
    fontFamily: T.fontFamily,
    fontSize: 12,
    color: T.inkMuted,
  },
  toggleSection: {
    alignItems: 'flex-end',
    gap: T.s2,
  },
  ruleScope: {
    fontFamily: T.fontFamily,
    fontSize: 11,
    color: T.inkMuted,
  },
  ruleBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: T.s3,
    paddingTop: T.s2,
    borderTopWidth: T.hairline,
    borderTopColor: T.border,
  },
  ruleMeta: {
    fontFamily: T.fontFamily,
    fontSize: 12,
    color: T.inkMuted,
  },
  ruleMetaValue: {
    fontFamily: T.fontSemiBold,
    fontSize: 12,
    color: T.ink,
  },
  addBtn: {
    marginHorizontal: T.s4,
    marginTop: T.s4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.s2,
    paddingVertical: T.s4,
    borderRadius: T.radius,
    borderWidth: 1,
    borderColor: T.accent + '40',
    borderStyle: 'dashed',
  },
  addText: {
    fontFamily: T.fontSemiBold,
    fontSize: 14,
    color: T.accent,
  },
});
