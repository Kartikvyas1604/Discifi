import { useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { T } from '../theme';
import { CloseIcon, ChevronLeftIcon, ShieldIcon, SparklesIcon, GlobeIcon, HistoryIcon, SettingsIcon, CopyIcon } from '../components/Icons';
import { useWallet } from '../services/WalletContext';
import { useNetwork } from '../services/NetworkContext';
import { NETWORK_LABELS, NETWORK_COLORS } from '../services/constants';
import { clearWallet } from '../services/secureStorage';
import type { Network } from '../services/types';

export default function SettingsScreen({ navigation }: any) {
  const [copied, setCopied] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const { hotAddress } = useWallet();
  const { network, setNetwork } = useNetwork();

  const handleCopy = () => {
    Clipboard.setStringAsync(hotAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwitchNetwork = async (n: Network) => {
    await setNetwork(n);
    setShowNetworkModal(false);
  };

  const handleDeleteWallet = () => {
    Alert.alert(
      'Delete Wallet',
      'This will permanently delete your wallet from this device. Make sure you have your seed phrase backed up.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await clearWallet();
            Alert.alert('Wallet Deleted', 'Please restart the app to create a new wallet.');
          },
        },
      ],
    );
  };

  const networkColor = NETWORK_COLORS[network] || '#8E8E93';
  const truncatedAddress = hotAddress.length > 8
    ? `${hotAddress.slice(0, 4)}...${hotAddress.slice(-4)}`
    : hotAddress;

  const sections = [
    {
      title: 'General',
      items: [
        { icon: <ShieldIcon size={18} color={T.accentLight} />, label: 'Covenants', value: 'Active' },
        { icon: <HistoryIcon size={18} color={T.accentLight} />, label: 'Transaction History' },
        { icon: <GlobeIcon size={18} color={T.accentLight} />, label: 'Currency', value: 'USD' },
        {
          icon: <View style={[styles.networkDotSmall, { backgroundColor: networkColor }]} />,
          label: 'Network',
          value: NETWORK_LABELS[network],
          onPress: () => setShowNetworkModal(true),
        },
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
      title: 'About',
      items: [
        { icon: <SparklesIcon size={18} color={T.accentLight} />, label: 'Version', value: '1.0.0' },
      ],
    },
    {
      title: 'Danger Zone',
      items: [
        { icon: <ShieldIcon size={18} color={T.danger} />, label: 'Delete Wallet', danger: true, onPress: handleDeleteWallet },
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
            <Text style={styles.address}>{truncatedAddress}</Text>
            <TouchableOpacity onPress={handleCopy} activeOpacity={0.7}>
              {copied ? <Text style={styles.copiedText}>✓</Text> : <CopyIcon size={14} color={T.inkMuted} />}
            </TouchableOpacity>
          </View>
          <View style={styles.networkRow}>
            <View style={[styles.networkDotSmall, { backgroundColor: networkColor }]} />
            <Text style={styles.walletType}>{NETWORK_LABELS[network]}</Text>
          </View>
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
                  onPress={item.onPress}
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

      {/* Network Switcher Modal */}
      <Modal visible={showNetworkModal} transparent animationType="slide" onRequestClose={() => setShowNetworkModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Network</Text>
            {(['mainnet', 'devnet', 'testnet'] as Network[]).map((n) => {
              const active = network === n;
              const color = NETWORK_COLORS[n];
              return (
                <TouchableOpacity
                  key={n}
                  style={[styles.networkOption, active && styles.networkOptionActive]}
                  onPress={() => handleSwitchNetwork(n)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.networkDot, { backgroundColor: color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.networkName, active && { color: T.accent }]}>
                      {NETWORK_LABELS[n]}
                    </Text>
                    <Text style={styles.networkDesc}>
                      {n === 'mainnet' ? 'Real SOL — use with caution' : `${n === 'devnet' ? 'Devnet' : 'Testnet'} SOL — for testing`}
                    </Text>
                  </View>
                  {active && <Text style={styles.checkMark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: T.s4, paddingTop: 56, paddingBottom: T.s4 },
  headerTitle: { fontFamily: T.fontBold, fontSize: 18, color: T.ink },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: T.s3, marginHorizontal: T.s4, backgroundColor: T.surface, borderRadius: T.radius, padding: T.s4, marginBottom: T.s5 },
  avatar: { width: 44, height: 44, borderRadius: T.radiusFull, backgroundColor: T.accent + '20', alignItems: 'center', justifyContent: 'center' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: T.s2 },
  address: { fontFamily: T.fontFamily, fontSize: 15, color: T.ink },
  networkRow: { flexDirection: 'row', alignItems: 'center', gap: T.s1, marginTop: T.s1 },
  networkDotSmall: { width: 8, height: 8, borderRadius: 4 },
  copiedText: { fontFamily: T.fontBold, fontSize: 14, color: T.safe },
  walletType: { fontFamily: T.fontFamily, fontSize: 12, color: T.inkMuted },
  section: { marginBottom: T.s5 },
  sectionTitle: { fontFamily: T.fontSemiBold, fontSize: 13, color: T.inkMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: T.s2, marginLeft: T.s1 },
  sectionCard: { backgroundColor: T.surface, borderRadius: T.radius },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: T.s3, paddingHorizontal: T.s4, borderBottomWidth: T.hairline, borderBottomColor: T.border },
  settingIcon: { width: 32, height: 32, borderRadius: T.radiusSm, backgroundColor: T.accent + '15', alignItems: 'center', justifyContent: 'center', marginRight: T.s3 },
  settingLabel: { flex: 1, fontFamily: T.fontFamily, fontSize: 15, color: T.ink },
  settingValue: { fontFamily: T.fontFamily, fontSize: 13, color: T.inkMuted, marginRight: T.s2 },
  chevron: { fontFamily: T.fontFamily, fontSize: 20, color: T.inkFaint },
  footer: { fontFamily: T.fontFamily, fontSize: 12, color: T.inkFaint, textAlign: 'center', marginTop: T.s5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: T.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: T.s5, paddingBottom: T.s7 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: T.surfaceElevated, alignSelf: 'center', marginBottom: T.s5 },
  modalTitle: { fontFamily: T.fontBold, fontSize: 20, color: T.ink, marginBottom: T.s5, letterSpacing: -0.3 },
  networkOption: { flexDirection: 'row', alignItems: 'center', gap: T.s3, paddingVertical: T.s4, paddingHorizontal: T.s4, borderRadius: T.radius, marginBottom: T.s2, backgroundColor: T.bg },
  networkOptionActive: { borderWidth: 1, borderColor: T.accent },
  networkDot: { width: 12, height: 12, borderRadius: 6 },
  networkName: { fontFamily: T.fontSemiBold, fontSize: 16, color: T.ink },
  networkDesc: { fontFamily: T.fontFamily, fontSize: 12, color: T.inkMuted, marginTop: T.s1 },
  checkMark: { fontFamily: T.fontBold, fontSize: 18, color: T.accent },
});
