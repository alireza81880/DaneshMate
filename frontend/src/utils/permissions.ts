import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Requests RECORD_AUDIO permission at runtime on Android.
 * Returns true if granted or on non-Android platforms.
 */
export async function requestAudioRecordingPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'مجوز دسترسی به میکروفون',
        message: 'دانش‌مات برای ضبط صوت جلسات و یادداشت‌های صوتی به مجوز میکروفون نیاز دارد.',
        buttonPositive: 'تایید',
        buttonNegative: 'انصراف',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('[Permissions] Error requesting RECORD_AUDIO permission:', err);
    return false;
  }
}
