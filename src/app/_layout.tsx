import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Appearance, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { ToastHost } from '../components/ui/Toast';

// Keep native splash visible until theme & auth hydration complete
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const isDark = useThemeStore((s) => s.isDark);
  const colors = useThemeStore((s) => s.colors);
  const loadPersistedTheme = useThemeStore((s) => s.loadPersistedTheme);
  const updateSystemScheme = useThemeStore((s) => s.updateSystemScheme);
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    Promise.resolve(loadPersistedTheme()).finally(() => setThemeReady(true));
    initializeAuth();

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      updateSystemScheme(colorScheme || 'dark');
    });

    return () => subscription.remove();
  }, [initializeAuth, loadPersistedTheme, updateSystemScheme]);

  // Hide static OS splash as soon as theme hydrates so the animated GIF splash screen plays immediately
  useEffect(() => {
    if (themeReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [themeReady]);

  // Safety fallback so native splash never stalls
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen
              name="transactions/add"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen name="transactions/[id]" />
            <Stack.Screen
              name="budgets/add"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="goals/add"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen name="goals/[id]" />
            <Stack.Screen
              name="split/create-group"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen name="split/[id]" />
            <Stack.Screen
              name="split/add-expense"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="split/settle"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen name="analytics/index" />
            <Stack.Screen name="settings/index" />
          </Stack>
          <ToastHost />
        </View>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
