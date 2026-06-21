import { useEffect } from 'react';
import * as ScreenCapture from 'expo-screen-capture';

export function useScreenCaptureProtection(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;
    const promise = ScreenCapture.preventScreenCaptureAsync();
    return () => {
      promise.then(() => ScreenCapture.allowScreenCaptureAsync());
    };
  }, [enabled]);
}
