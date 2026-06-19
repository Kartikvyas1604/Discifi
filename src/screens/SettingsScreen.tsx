import { useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { T } from '../theme';
import { CloseIcon, ChevronLeftIcon, ShieldIcon, SparklesIcon, GlobeIcon, HistoryIcon, SettingsIcon, CopyIcon } from '../components/Icons';

interface SettingRow {
  icon: React.ReactNode;
  label: string;
  value?: string;
  danger?: boolean;
}

export default function SettingsScreen({ navigation }: any) {
  const [copied, setCopied] = useState(false);
  const address = '4f3c9a8b...b82a';

  const handleCopy = () => {
    Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sections: { title: string; items: SettingRow[] }[] = [
    {
      title: 'General',
      items: [
        { icon: <ShieldIcon size={18} color={T.accentLight} />, label: 'Covenants', value: '5 rules' },
        { icon: <HistoryIcon size={18} color={T.accentLight} />, label: 'Transaction History' },
        { icon: <GlobeIcon size={18} color={T.accentLight} />, label: 'Currency', value: 'USD' },
      ],
    },
    {
      title: 'Security',
      items: [
        { icon: <ShieldIcon size={18} color={T.accentLight} />, label: 'App Lock' },
        { icon: <ShieldIcon size={18} color={T.accentLight} />, label: 'Auto-Lock Timer', value: '5 min' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: <GlobeIcon size={18} color={T.accentLight} />, label: 'Documentation' },
        { icon: <GlobeIcon size={18} color={T.accentLight} />, label: 'Terms of Service' },
        { icon: <GlobeIcon size={18} color={T.accentLight} />, label: 'Privacy Policy' },
      ],
    },
    {
      title: 'About',
      items: [
        { icon: <SparklesIcon size={18} color={T.accentLight} />, label: 'Version', value: '1.0.0' },
      ],
    },
    {
      title: 'Danger Zone',
      items: [
        { icon: <ShieldIcon size={18} color={T.danger} />, label: 'Reset All Covenants', danger: true },
        { icon: <ShieldIcon size={18} color={T.danger} />, label: 'Delete Wallet', danger: true },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeftIcon size={24} color={T.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <SparklesIcon size={20} color={T.accentLight} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.addressRow}>
            <Text style={styles.address}>{address}</Text>
            <TouchableOpacity onPress={handleCopy} activeOpacity={0.7}>
              {copied ? <Text style={styles.copiedText}>✓</Text> : <CopyIcon size={14} color={T.inkMuted} />}
            </TouchableOpacity>
          </View>
          <Text style={styles.walletType}>Solana Wallet</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: T.s4, paddingBottom: T.s5 }}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, ii) => (
                <TouchableOpacity
                  key={ii}
                  style={[styles.settingRow, ii === section.items.length - 1 && { borderBottomWidth: 0 }]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.settingIcon, item.danger && { backgroundColor: T.danger + '15' }]}>
                    {item.icon}
                  </View>
                  <Text style={[styles.settingLabel, item.danger && { color: T.danger }]}>
                    {item.label}
                  </Text>
                  {item.value && (
                    <Text style={styles.settingValue}>{item.value}</Text>
                  )}
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.footer}>DisciFi v1.0.0</Text>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.s3,
    marginHorizontal: T.s4,
    backgroundColor: T.surface,
    borderRadius: T.radius,
    padding: T.s4,
    marginBottom: T.s5,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: T.radiusFull,
    backgroundColor: T.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.s2,
  },
  address: {
    fontFamily: T.fontFamily,
    fontSize: 15,
    color: T.ink,
  },
  copiedText: {
    fontFamily: T.fontBold,
    fontSize: 14,
    color: T.safe,
  },
  walletType: {
    fontFamily: T.fontFamily,
    fontSize: 12,
    color: T.inkMuted,
    marginTop: T.s1,
  },
  section: {
    marginBottom: T.s5,
  },
  sectionTitle: {
    fontFamily: T.fontSemiBold,
    fontSize: 13,
    color: T.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: T.s2,
    marginLeft: T.s1,
  },
  sectionCard: {
    backgroundColor: T.surface,
    borderRadius: T.radius,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: T.s3,
    paddingHorizontal: T.s4,
    borderBottomWidth: T.hairline,
    borderBottomColor: T.border,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: T.radiusSm,
    backgroundColor: T.accent + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: T.s3,
  },
  settingLabel: {
    flex: 1,
    fontFamily: T.fontFamily,
    fontSize: 15,
    color: T.ink,
  },
  settingValue: {
    fontFamily: T.fontFamily,
    fontSize: 13,
    color: T.inkMuted,
    marginRight: T.s2,
  },
  chevron: {
    fontFamily: T.fontFamily,
    fontSize: 20,
    color: T.inkFaint,
  },
  footer: {
    fontFamily: T.fontFamily,
    fontSize: 12,
    color: T.inkFaint,
    textAlign: 'center',
    marginTop: T.s5,
  },
});
