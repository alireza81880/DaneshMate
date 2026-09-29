import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { ThemeProvider } from './src/theme/ThemeContext';
import { HomeScreen } from './src/screens/HomeScreen';

const CRASH_LOG_STORAGE_KEY = '@daneshmate/last_crash_log';

interface CrashLogData {
  message: string;
  stack?: string;
  timestamp: string;
}

// Global JS error handler registration for React Native runtime
if (typeof global !== 'undefined' && (global as any).ErrorUtils) {
  try {
    const previousGlobalHandler = (global as any).ErrorUtils.getGlobalHandler?.();
    (global as any).ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
      try {
        const crashPayload: CrashLogData = {
          message: error?.message ? String(error.message) : String(error),
          stack: error?.stack ? String(error.stack) : '',
          timestamp: new Date().toISOString(),
        };
        AsyncStorage.setItem(CRASH_LOG_STORAGE_KEY, JSON.stringify(crashPayload)).catch(() => {});
      } catch {}

      if (typeof previousGlobalHandler === 'function') {
        previousGlobalHandler(error, isFatal);
      }
    });
  } catch (handlerErr) {
    console.warn('[CrashHandler] Failed to hook ErrorUtils:', handlerErr);
  }
}

interface CrashFallbackProps {
  crashLog: CrashLogData;
  onDismiss: () => void;
}

const CrashFallbackScreen: React.FC<CrashFallbackProps> = ({ crashLog, onDismiss }) => {
  const [copied, setCopied] = useState(false);

  const fullCrashReport = `[DaneshMate Crash Report]\nTime: ${crashLog.timestamp}\nMessage: ${crashLog.message}\nPlatform: ${Platform.OS}\n\nStack Trace:\n${crashLog.stack || '(No stack trace available)'}`;

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullCrashReport);
      }
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <SafeAreaView style={styles.crashContainer}>
      <View style={styles.crashHeader}>
        <Text style={styles.crashEmoji}>⚠️</Text>
        <Text style={styles.crashTitle}>گزارش خطای برنامه (Crash Report)</Text>
        <Text style={styles.crashSubtitle}>
          برنامه در اجرای قبلی با خطا متوقف شد. جزئیات زیر جهت عیب‌یابی ثبت شده است:
        </Text>
      </View>

      <View style={styles.timestampBox}>
        <Text style={styles.timestampText}>زمان: {crashLog.timestamp}</Text>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionHeader}>پیام خطا (Error Message):</Text>
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>{crashLog.message}</Text>
        </View>

        <Text style={styles.sectionHeader}>ردپای پشته (Stack Trace):</Text>
        <TextInput
          style={styles.stackTraceInput}
          value={crashLog.stack || 'No stack trace captured.'}
          editable={false}
          multiline
          scrollEnabled={false}
          selectTextOnFocus
        />
      </ScrollView>

      <View style={styles.actionRow}>
        <Pressable
          style={({ pressed }) => [styles.copyButton, pressed && { opacity: 0.8 }]}
          onPress={handleCopy}
        >
          <Text style={styles.copyButtonText}>{copied ? 'کپی شد ✓' : '📋 کپی متن خطا'}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.dismissButton, pressed && { opacity: 0.8 }]}
          onPress={onDismiss}
        >
          <Text style={styles.dismissButtonText}>پاک کردن و ورود به برنامه</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    try {
      const crashPayload: CrashLogData = {
        message: error?.message ? String(error.message) : String(error),
        stack: `${error?.stack || ''}\nComponent Stack:\n${errorInfo?.componentStack || ''}`,
        timestamp: new Date().toISOString(),
      };
      AsyncStorage.setItem(CRASH_LOG_STORAGE_KEY, JSON.stringify(crashPayload)).catch(() => {});
    } catch {}
  }

  handleDismiss = () => {
    AsyncStorage.removeItem(CRASH_LOG_STORAGE_KEY).catch(() => {});
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <CrashFallbackScreen
          crashLog={{
            message: this.state.error.message || 'Unknown React render error',
            stack: this.state.error.stack,
            timestamp: new Date().toISOString(),
          }}
          onDismiss={this.handleDismiss}
        />
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Vazirmatn-Regular': require('./assets/fonts/Vazirmatn-Regular.ttf'),
    'Vazirmatn-Medium': require('./assets/fonts/Vazirmatn-Medium.ttf'),
    'Vazirmatn-SemiBold': require('./assets/fonts/Vazirmatn-SemiBold.ttf'),
    'Vazirmatn-Bold': require('./assets/fonts/Vazirmatn-Bold.ttf'),
    'PlusJakartaSans-Regular': require('./assets/fonts/PlusJakartaSans-Regular.ttf'),
    'PlusJakartaSans-Medium': require('./assets/fonts/PlusJakartaSans-Medium.ttf'),
    'PlusJakartaSans-SemiBold': require('./assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'PlusJakartaSans-Bold': require('./assets/fonts/PlusJakartaSans-Bold.ttf'),
  });

  const [savedCrashLog, setSavedCrashLog] = useState<CrashLogData | null>(null);
  const [checkedStorage, setCheckedStorage] = useState(false);

  useEffect(() => {
    async function checkPreviousCrash() {
      try {
        const rawLog = await AsyncStorage.getItem(CRASH_LOG_STORAGE_KEY);
        if (rawLog) {
          const parsed = JSON.parse(rawLog);
          if (parsed && parsed.message) {
            setSavedCrashLog(parsed);
          }
        }
      } catch {}
      setCheckedStorage(true);
    }
    checkPreviousCrash();
  }, []);

  const handleDismissSavedCrash = () => {
    AsyncStorage.removeItem(CRASH_LOG_STORAGE_KEY).catch(() => {});
    setSavedCrashLog(null);
  };

  if (checkedStorage && savedCrashLog) {
    return <CrashFallbackScreen crashLog={savedCrashLog} onDismiss={handleDismissSavedCrash} />;
  }

  if (!fontsLoaded && Platform.OS !== 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4361EE" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <HomeScreen />
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  crashContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
    justifyContent: 'space-between',
  },
  crashHeader: {
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  crashEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  crashTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#f87171',
    textAlign: 'center',
    marginBottom: 6,
  },
  crashSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
  timestampBox: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 12,
  },
  timestampText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  scrollArea: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
    marginBottom: 6,
    marginTop: 6,
  },
  messageBox: {
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    marginBottom: 10,
  },
  messageText: {
    fontSize: 12,
    color: '#fca5a5',
    fontWeight: '600',
  },
  stackTraceInput: {
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  copyButton: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  dismissButton: {
    flex: 1,
    backgroundColor: '#4361ee',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
