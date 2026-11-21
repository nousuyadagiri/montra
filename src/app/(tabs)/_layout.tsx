import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';
import { supabase } from '../../lib/supabase';
import { FloatingTabBar } from '../../components/navigation/FloatingTabBar';
import {
  HomeTabIcon,
  ActivityTabIcon,
  BudgetsTabIcon,
  SplitTabIcon,
  ProfileTabIcon,
} from '../../components/navigation/TabBarIcons';

export default function TabLayout() {
  const { colors } = useAppTheme();
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

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: { position: 'absolute', borderTopWidth: 0 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <HomeTabIcon color={color} focused={focused} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Activity",
          tabBarIcon: ({ color, focused }) => (
            <ActivityTabIcon color={color} focused={focused} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: "Budgets",
          tabBarIcon: ({ color, focused }) => (
            <BudgetsTabIcon color={color} focused={focused} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="split"
        options={{
          title: "Split",
          tabBarIcon: ({ color, focused }) => (
            <SplitTabIcon color={color} focused={focused} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <ProfileTabIcon color={color} focused={focused} size={20} />
          ),
        }}
      />
    </Tabs>
  );
}
