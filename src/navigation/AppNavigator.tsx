import { Text, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Svg, { Rect, Polygon, Circle, Path } from 'react-native-svg';
import { theme } from '../theme';
import DashboardScreen from '../screens/DashboardScreen';
import RulesScreen from '../screens/RulesScreen';
import VaultScreen from '../screens/VaultScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import TransactionGateScreen from '../screens/TransactionGateScreen';

type TabParamList = {
  Dashboard: undefined;
  Rules: undefined;
  Vault: undefined;
};

type StackParamList = {
  MainTabs: undefined;
  TransactionGate: undefined;
  Onboarding: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<StackParamList>();

function GridIcon({ active }: { active: boolean }) {
  const color = active ? theme.accent : theme.muted;
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Rect x="1" y="1" width="7" height="7" fill="none" stroke={color} strokeWidth={1.2} />
      <Rect x="12" y="1" width="7" height="7" fill="none" stroke={color} strokeWidth={1.2} />
      <Rect x="1" y="12" width="7" height="7" fill="none" stroke={color} strokeWidth={1.2} />
      <Rect x="12" y="12" width="7" height="7" fill="none" stroke={color} strokeWidth={1.2} />
    </Svg>
  );
}

function RulesIcon({ active }: { active: boolean }) {
  const color = active ? theme.accent : theme.muted;
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Polygon points="10,2 18,6 18,14 10,18 2,14 2,6" fill="none" stroke={color} strokeWidth={1.2} />
      <Circle cx="10" cy="10" r="3" fill="none" stroke={color} strokeWidth={1.2} />
    </Svg>
  );
}

function VaultIcon({ active }: { active: boolean }) {
  const color = active ? theme.accent : theme.muted;
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Rect x="2" y="6" width="16" height="12" fill="none" stroke={color} strokeWidth={1.2} />
      <Path d="M6,6 L6,4 Q6,2 10,2 Q14,2 14,4 L14,6" fill="none" stroke={color} strokeWidth={1.2} />
      <Circle cx="10" cy="12" r="2" fill="none" stroke={color} strokeWidth={1.2} />
    </Svg>
  );
}

function TabBar({ state, descriptors, navigation }: any) {
  const icons = [GridIcon, RulesIcon, VaultIcon];

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const Icon = icons[index];

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
          <View key={route.key} style={styles.tabItem}>
            <Icon active={isFocused} />
            {isFocused && <View style={styles.tabIndicator} />}
          </View>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Rules" component={RulesScreen} />
      <Tab.Screen name="Vault" component={VaultScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="TransactionGate"
          component={TransactionGateScreen}
          options={{ presentation: 'fullScreenModal', animation: 'fade' }}
        />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingBottom: 24,
    paddingTop: 12,
    height: 72,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIndicator: {
    width: 16,
    height: 2,
    backgroundColor: theme.accent,
    marginTop: 6,
  },
});
