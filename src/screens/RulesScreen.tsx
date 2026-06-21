import { useState, useEffect } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  TextInput,
  Modal,
} from 'react-native';
import { T } from '../theme';
import { ShieldIcon, PlusIcon } from '../components/Icons';
import { getRules, storeRules } from '../services/secureStorage';
import { DEFAULT_RULES, type RuleConfig } from '../services/types';

interface Rule {
  id: string;
  type: string;
  value: string;
  numericValue: number;
  scope: string;
  active: boolean;
  description: string;
}

export default function RulesScreen() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editRule, setEditRule] = useState<Rule | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    (async () => {
      const stored = await getRules();
      const cfg = stored || DEFAULT_RULES;
      setRules([
        { id: '1', type: 'Daily Limit', value: `$${cfg.dailyLimit.toLocaleString()}`, numericValue: cfg.dailyLimit, scope: 'All categories', active: true, description: 'Max spend per day across all protocols' },
        { id: '2', type: 'Max Per Tx', value: `$${cfg.perTxLimit.toLocaleString()}`, numericValue: cfg.perTxLimit, scope: 'All tokens', active: true, description: 'Single transaction cap' },
        { id: '5', type: 'Auto-Save', value: `${cfg.autoSavePct}%`, numericValue: cfg.autoSavePct, scope: 'Incoming transfers', active: true, description: 'Auto-convert incoming to vault' },
        { id: '6', type: 'Velocity Limit', value: `${cfg.velocityLimit} tx/hr`, numericValue: cfg.velocityLimit, scope: 'All transactions', active: true, description: 'Maximum transactions per hour' },
        { id: '7', type: 'Slippage', value: `${(cfg.slippageBps / 100).toFixed(1)}%`, numericValue: cfg.slippageBps, scope: 'Swaps', active: true, description: 'Maximum slippage for swaps' },
      ]);
      setLoading(false);
    })();
  }, []);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const handleEdit = (rule: Rule) => {
    setEditRule(rule);
    setEditValue(rule.numericValue.toString());
  };

  const handleSaveEdit = async () => {
    if (!editRule) return;
    const val = parseFloat(editValue);
    if (isNaN(val) || val <= 0) return;

    const stored = (await getRules()) || DEFAULT_RULES;
    const updated: RuleConfig = { ...stored };

    switch (editRule.id) {
      case '1': updated.dailyLimit = val; break;
      case '2': updated.perTxLimit = val; break;
      case '5': updated.autoSavePct = val; break;
      case '6': updated.velocityLimit = Math.floor(val); break;
      case '7': updated.slippageBps = Math.floor(val * 100); break;
    }

    await storeRules(updated);

    setRules(prev => prev.map(r => {
      if (r.id === editRule.id) {
        const display = editRule.id === '6' ? `${Math.floor(val)} tx/hr` :
          editRule.id === '7' ? `${val.toFixed(1)}%` :
          editRule.id === '5' ? `${val}%` :
          `$${val.toLocaleString()}`;
        return { ...r, value: display, numericValue: val };
      }
      return r;
    }));
    setEditRule(null);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: T.inkMuted }}>Loading rules...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: T.s5 }}
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
              <Text style={styles.summaryValue}>{rules.find(r => r.id === '1')?.value || '$800'}</Text>
              <Text style={styles.summaryLabel}>Daily Limit</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{rules.find(r => r.id === '5')?.value || '15%'}</Text>
              <Text style={styles.summaryLabel}>Auto-Save</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{rules.find(r => r.id === '6')?.value || '10'}</Text>
              <Text style={styles.summaryLabel}>Velocity</Text>
            </View>
          </View>
        </View>

        {/* Rules List */}
        <View style={styles.rulesSection}>
          {rules.map((rule) => (
            <TouchableOpacity key={rule.id} onPress={() => handleEdit(rule)} activeOpacity={0.7}>
              <View style={[styles.ruleCard, !rule.active && styles.ruleCardInactive]}>
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
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Edit Rule Modal */}
      <Modal visible={!!editRule} transparent animationType="fade" onRequestClose={() => setEditRule(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit {editRule?.type}</Text>
            <Text style={styles.modalDesc}>Enter new value</Text>
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              keyboardType="decimal-pad"
              autoFocus
              selectionColor={T.accent}
              placeholderTextColor={T.inkFaint}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditRule(null)} activeOpacity={0.8}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveEdit} activeOpacity={0.8}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: { paddingHorizontal: T.s4, paddingTop: 56, marginBottom: T.s5 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: T.s3, marginBottom: T.s1 },
  headerIcon: { width: 36, height: 36, borderRadius: T.radiusFull, backgroundColor: T.accent + '20', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: T.fontBold, fontSize: 28, color: T.ink, letterSpacing: -0.5 },
  subtitle: { fontFamily: T.fontFamily, fontSize: 14, color: T.inkMuted, marginLeft: 44 },
  summaryCard: { marginHorizontal: T.s4, backgroundColor: T.surface, borderRadius: T.radius, padding: T.s4, marginBottom: T.s5 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 36, backgroundColor: T.border },
  summaryValue: { fontFamily: T.fontBold, fontSize: 22, color: T.ink, letterSpacing: -0.5 },
  summaryLabel: { fontFamily: T.fontFamily, fontSize: 11, color: T.inkMuted, marginTop: T.s1 },
  rulesSection: { paddingHorizontal: T.s4, gap: T.s3 },
  ruleCard: { backgroundColor: T.surface, borderRadius: T.radius, padding: T.s4, borderWidth: 1, borderColor: T.accent + '20' },
  ruleCardInactive: { borderColor: T.border, opacity: 0.7 },
  ruleTop: { flexDirection: 'row', justifyContent: 'space-between' },
  ruleInfo: { flex: 1, marginRight: T.s3 },
  ruleType: { fontFamily: T.fontFamily, fontSize: 11, color: T.accent, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: T.s1 },
  ruleValue: { fontFamily: T.fontBold, fontSize: 28, color: T.ink, letterSpacing: -0.5, marginBottom: T.s1 },
  ruleDesc: { fontFamily: T.fontFamily, fontSize: 12, color: T.inkMuted },
  toggleSection: { alignItems: 'flex-end', gap: T.s2 },
  ruleScope: { fontFamily: T.fontFamily, fontSize: 11, color: T.inkMuted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: T.s4 },
  modalContent: { backgroundColor: T.surface, borderRadius: T.radius, padding: T.s5 },
  modalTitle: { fontFamily: T.fontBold, fontSize: 20, color: T.ink, marginBottom: T.s1 },
  modalDesc: { fontFamily: T.fontFamily, fontSize: 14, color: T.inkMuted, marginBottom: T.s5 },
  modalInput: { fontFamily: T.fontBold, fontSize: 32, color: T.ink, backgroundColor: T.bg, borderRadius: T.radius, padding: T.s4, textAlign: 'center', marginBottom: T.s5 },
  modalButtons: { flexDirection: 'row', gap: T.s3 },
  modalCancel: { flex: 1, paddingVertical: T.s4, borderRadius: T.radius, alignItems: 'center', backgroundColor: T.surfaceElevated },
  modalCancelText: { fontFamily: T.fontSemiBold, fontSize: 15, color: T.ink },
  modalSave: { flex: 1, paddingVertical: T.s4, borderRadius: T.radius, alignItems: 'center', backgroundColor: T.accent },
  modalSaveText: { fontFamily: T.fontSemiBold, fontSize: 15, color: T.ink },
});
