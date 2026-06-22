import { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, Text, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { PublicKey } from '@solana/web3.js';
import { T } from '../theme';
import { WalletIcon, ShieldIcon, VaultIcon, SendIcon, ReceiveIcon, SwapIcon, GlobeIcon, HistoryIcon, SettingsIcon } from '../components/Icons';
import DashboardScreen from '../screens/DashboardScreen';
import RulesScreen from '../screens/RulesScreen';
import VaultScreen from '../screens/VaultScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import TransactionGateScreen from '../screens/TransactionGateScreen';
import SendScreen from '../screens/SendScreen';
import ReceiveScreen from '../screens/ReceiveScreen';
import SwapScreen from '../screens/SwapScreen';
import ActivityScreen from '../screens/ActivityScreen';
import BrowserScreen from '../screens/BrowserScreen';
import TokenDetailScreen from '../screens/TokenDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { WalletProvider } from '../services/WalletContext';
import type { WalletSet } from '../crypto/types';
import { hasStoredWallet, getMnemonic, getPubKey } from '../services/secureStorage';
import { mnemonicToSeed } from '../crypto/bip39';
import { deriveWalletSet } from '../crypto/address';

type TabParamList = {
  Ledger: undefined;
  Covenants: undefined;
  Reserve: undefined;
};

type RootStackParamList = {
  MainTabs: undefined;
  Send: undefined;
  Receive: undefined;
  Swap: undefined;
  Activity: undefined;
  Browser: undefined;
  TokenDetail: { symbol: string; name: string; mint: string; balance: number; value: number; usdValue: number; change24h: number; color: string };
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const NAV_ITEMS = [
  { key: 'Ledger', icon: WalletIcon, label: 'Wallet' },
  { key: 'Covenants', icon: ShieldIcon, label: 'Rules' },
  { key: 'Reserve', icon: VaultIcon, label: 'Vault' },
];

function TabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.tabBar}>
      <View style={styles.tabBarInner}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const item = NAV_ITEMS[index];
          if (!item) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <item.icon size={22} color={isFocused ? T.accent : T.inkFaint} />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.getParent().navigate('Send')} activeOpacity={0.8}>
          <SendIcon size={20} color={T.ink} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => navigation.getParent().navigate('Swap')} activeOpacity={0.8}>
          <SwapIcon size={22} color={T.ink} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.getParent().navigate('Receive')} activeOpacity={0.8}>
          <ReceiveIcon size={20} color={T.ink} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.getParent().navigate('Browser')} activeOpacity={0.8}>
          <GlobeIcon size={18} color={T.ink} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Ledger" component={DashboardScreen} />
      <Tab.Screen name="Covenants" component={RulesScreen} />
      <Tab.Screen name="Reserve" component={VaultScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showTxGate, setShowTxGate] = useState(false);
  const [walletSet, setWalletSet] = useState<WalletSet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const exists = await hasStoredWallet();
      if (exists) {
        const mnemonicStr = await getMnemonic();
        if (mnemonicStr) {
          const words = mnemonicStr.split(' ');
          const seed = await mnemonicToSeed(words, '');
          const wallets = deriveWalletSet(seed);
          setWalletSet(wallets);
          setShowOnboarding(false);
        }
      }
      setLoading(false);
    })();
  }, []);

  const handleOnboardingComplete = (wallets: WalletSet) => {
    setWalletSet(wallets);
    setShowOnboarding(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={T.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Modal visible={showOnboarding} animationType="fade" onRequestClose={() => {}}>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </Modal>
      <TransactionGateScreen
        visible={showTxGate}
        onClose={() => setShowTxGate(false)}
      />
      <WalletProvider walletSet={walletSet}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Send" component={SendScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="Receive" component={ReceiveScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="Swap" component={SwapScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="Activity" component={ActivityScreen} />
        <Stack.Screen name="Browser" component={BrowserScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="TokenDetail" component={TokenDetailScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
      </WalletProvider>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: T.surface,
    borderTopWidth: 0,
    paddingBottom: 0,
  },
  tabBarInner: {
    flexDirection: 'row',
    paddingTop: T.s2,
    paddingBottom: T.s2,
    borderTopWidth: T.hairline,
    borderTopColor: T.border,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.s1,
  },
  tabLabel: {
    fontFamily: T.fontFamily,
    fontSize: 10,
    color: T.inkFaint,
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: T.accent,
    fontFamily: T.fontSemiBold,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: T.s4,
    paddingVertical: T.s2,
    paddingBottom: T.s5,
    borderTopWidth: T.hairline,
    borderTopColor: T.border,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: T.radiusFull,
    backgroundColor: T.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimary: {
    width: 52,
    height: 52,
    borderRadius: T.radiusFull,
    backgroundColor: T.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: T.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
