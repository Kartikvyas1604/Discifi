import { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_400Regular, PlayfairDisplay_400Regular_Italic, PlayfairDisplay_700Bold, PlayfairDisplay_700Bold_Italic } from '@expo-google-fonts/playfair-display';
import { CormorantGaramond_400Regular_Italic, CormorantGaramond_700Bold_Italic } from '@expo-google-fonts/cormorant-garamond';
import { LibreBaskerville_400Regular, LibreBaskerville_700Bold, LibreBaskerville_400Regular_Italic } from '@expo-google-fonts/libre-baskerville';
import { CourierPrime_400Regular, CourierPrime_700Bold } from '@expo-google-fonts/courier-prime';
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from './src/navigation/AppNavigator';
import { T } from './src/theme';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_700Bold_Italic,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_700Bold_Italic,
    LibreBaskerville_400Regular,
    LibreBaskerville_700Bold,
    LibreBaskerville_400Regular_Italic,
    CourierPrime_400Regular,
    CourierPrime_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={styles.root} onLayout={onLayoutRootView}>
      <StatusBar style="dark" />
      <AppNavigator />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
});
