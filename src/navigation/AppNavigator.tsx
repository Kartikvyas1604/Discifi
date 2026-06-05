import { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { T } from '../theme';
import { Glyph } from '../components/Glyph';
import DashboardScreen from '../screens/DashboardScreen';
import RulesScreen from '../screens/RulesScreen';
import VaultScreen from '../screens/VaultScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import TransactionGateScreen from '../screens/TransactionGateScreen';

type TabParamList = {
  Ledger: undefined;
  Covenants: undefined;
  Reserve: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const NAV_ITEMS = [
  { key: 'Ledger', glyph: '◈' as const },
  { key: 'Covenants', glyph: '◆' as const },
  { key: 'Reserve', glyph: '⊕' as const },
];

function TabBar({ state, descriptors, navigation, onTestTx }: any) {
  return (
    <View style={styles.tabBar}>
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
            <Glyph
              symbol={item.glyph}
              size={18}
              color={isFocused ? T.gold : T.inkFaint}
            />
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity style={styles.tabItem} onPress={onTestTx} activeOpacity={0.7}>
        <Glyph symbol="⊗" size={16} color={T.danger} />
      </TouchableOpacity>
    </View>
  );
}

function MainTabs({ onTestTx }: { onTestTx: () => void }) {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} onTestTx={onTestTx} />}
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

  return (
    <NavigationContainer>
      <Modal visible={showOnboarding} animationType="fade" onRequestClose={() => {}}>
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
      </Modal>
      <TransactionGateScreen
        visible={showTxGate}
        onClose={() => setShowTxGate(false)}
      />
      <MainTabs onTestTx={() => setShowTxGate(true)} />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: T.bg,
    borderTopWidth: T.hairline,
    borderTopColor: T.border,
    paddingBottom: 28,
    paddingTop: T.s3,
    height: 64,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
