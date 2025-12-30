import './global.css';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

// Only load CSS on web platform
if (Platform.OS === 'web') {
  require('./global.css');
}
import { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from './src/contexts/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import { testBackendConnection } from './src/services/api';

// Luxury Theme for Navigation
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F7F4EF', // Warm paper background
    card: '#FFFFFF',
    text: '#121212',
    border: 'rgba(18,18,18,0.08)',
    primary: '#1E2A44',
  },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - premium caching
      gcTime: 10 * 60 * 1000, // 10 minutes - prevent unnecessary refetches
      retry: 2,
      refetchOnWindowFocus: false, // Prevent spam on app focus
    },
  },
});

export default function App() {
  // One-time connectivity check on app start (development only)
  useEffect(() => {
    if (__DEV__) {
      testBackendConnection().then((result) => {
        if (!result.success) {
          console.warn('🔴 Backend Connectivity Check:', result.message);
        } else {
          console.log('✅ Backend Connectivity Check:', result.message);
        }
      });
    }
  }, []);

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#F7F4EF' }}>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer theme={AppTheme}>
            <AppNavigator />
            <StatusBar style="dark" backgroundColor="#F7F4EF" />
          </NavigationContainer>
        </QueryClientProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
