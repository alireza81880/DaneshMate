import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeContext';
import { HomeScreen } from './src/screens/HomeScreen';

interface BoundaryState {
  error: Error | null;
}

/**
 * Root error boundary: in a release build an uncaught render error closes the app instantly.
 * This catches it and shows the message on screen so the real cause is visible.
 */
class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[DaneshMate] Uncaught render error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>خطای غیرمنتظره در اجرای برنامه</Text>
        <ScrollView style={styles.box}>
          <Text selectable style={styles.message}>
            {String(this.state.error?.message || this.state.error)}
          </Text>
        </ScrollView>
        <TouchableOpacity style={styles.button} onPress={() => this.setState({ error: null })}>
          <Text style={styles.buttonText}>تلاش مجدد</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

export default function App() {
  return (
    <RootErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <HomeScreen />
        </ThemeProvider>
      </SafeAreaProvider>
    </RootErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16', padding: 24, justifyContent: 'center' },
  title: { color: '#F87171', fontSize: 17, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
  box: { maxHeight: 260, backgroundColor: '#111827', borderRadius: 12, padding: 12, marginBottom: 20 },
  message: { color: '#E5E7EB', fontSize: 12, textAlign: 'left' },
  button: { backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
});
