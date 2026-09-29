import { registerRootComponent } from 'expo';
import { I18nManager, Platform } from 'react-native';

// DaneshMate Persian RTL initialization
if (Platform.OS !== 'web') {
  try {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
  } catch (err) {
    console.warn('[RTL] Failed to force RTL at entry:', err);
  }
}

import App from './App';

registerRootComponent(App);

