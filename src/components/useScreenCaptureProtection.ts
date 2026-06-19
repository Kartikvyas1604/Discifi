import { useEffect } from 'react';
import { Platform, NativeModules } from 'react-native';

export function useScreenCaptureProtection(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;
    if (Platform.OS === 'android') {
      try {
        const ScreensNativeModule = NativeModules.RNScreensModule || NativeModules.RNScreens;
        if (ScreensNativeModule?.addEventListener) {
          (async () => {
            await ScreensNativeModule.screenCaptureProtected?.(true);
          })();
        }
      } catch {}
    }
  }, [enabled]);
}
