import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, ArrowLeftRight, LayoutGrid, Users, User } from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';
import { supabase } from '../../lib/supabase';

export default function TabLayout() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const bumpSync = useSyncStore((s) => s.bumpSync);

  // Real-time Supabase synchronization for authenticated users
  useEffect(() => {
    if (!user?.id) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      // Remove any lingering or previous channels for this user to avoid callback attachment collisions
      const existingChannels = supabase.getChannels().filter((ch) =>
        ch.topic.includes(`montra-rt-${user.id}`)
      );
      for (const ch of existingChannels) {
        supabase.removeChannel(ch);
      }

      // Create a dedicated channel with unique timestamp to guarantee a fresh, unsubscribed instance
      channel = supabase
        .channel(`montra-rt-${user.id}-${Date.now()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          (payload) => {
            if (payload.table === 'profiles') {
              refreshProfile();
            } else {
              bumpSync();
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription error (non-fatal):', err);
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [user?.id, refreshProfile, bumpSync]);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Authentic Apple iOS Tab Bar: Translucent, docked at bottom edge with safe area insets
  const bottomInset = insets.bottom;
  const barHeight = Platform.OS === 'ios' ? 49 + bottomInset : 58 + (bottomInset > 0 ? bottomInset : 8);

  const activeColor = colors.primary;
  const inactiveColor = isDark ? '#8E8E93' : '#8E8E93'; // Apple system gray

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: barHeight,
          backgroundColor: isDark ? 'rgba(18, 18, 22, 0.94)' : 'rgba(255, 255, 255, 0.92)',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
          paddingTop: 6,
          paddingBottom: Math.max(bottomInset, Platform.OS === 'ios' ? 8 : 6),
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.25 : 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.15,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, focused }) => (
            <ArrowLeftRight size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Budgets',
          tabBarIcon: ({ color, focused }) => (
            <LayoutGrid size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="split"
        options={{
          title: 'Split',
          tabBarIcon: ({ color, focused }) => (
            <Users size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <User size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />
    </Tabs>
  );
}
