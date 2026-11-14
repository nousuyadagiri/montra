import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';
import { supabase } from '../../lib/supabase';

type TabIconName = 'home' | 'transactions' | 'budgets' | 'split' | 'profile';

interface TabIconProps {
  name: TabIconName;
  color: any;
  focused: boolean;
  activeBg: string;
  cutoutColor: string;
}

function TabVectorIcon({
  name,
  color,
  focused,
  cutoutColor,
}: {
  name: TabIconName;
  color: any;
  focused: boolean;
  cutoutColor: string;
}) {
  switch (name) {
    case 'home':
      return focused ? (
        <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12.71 2.29a1 1 0 0 0-1.42 0l-8 7.5A1 1 0 0 0 3 10.5V20a2 2 0 0 0 2 2h4.25a.75.75 0 0 0 .75-.75v-5.5a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v5.5a.75.75 0 0 0 .75.75H19a2 2 0 0 0 2-2v-9.5a1 1 0 0 0-.29-.71l-8-7.5Z"
            fill={color}
          />
        </Svg>
      ) : (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 10.5 12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1-.5-.5v-5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v5a.5.5 0 0 1-.5.5h-4A1.5 1.5 0 0 1 3 20v-9.5Z"
            stroke={color}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'transactions':
      return focused ? (
        <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
          <Rect x={2.5} y={4.5} width={19} height={15} rx={4} fill={color} />
          <Path
            d="M7.5 10h9m0 0-2.1-2.1M16.5 10l-2.1 2.1M16.5 14.5h-9m0 0 2.1-2.1M7.5 14.5l2.1 2.1"
            stroke={cutoutColor}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ) : (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Rect x={2.5} y={4.5} width={19} height={15} rx={4} stroke={color} strokeWidth={1.8} />
          <Path
            d="M7.5 10h9m0 0-2.1-2.1M16.5 10l-2.1 2.1M16.5 14.5h-9m0 0 2.1-2.1M7.5 14.5l2.1 2.1"
            stroke={color}
            strokeWidth={1.65}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'budgets':
      return focused ? (
        <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
          <Path
            d="M11.2 3.05a9 9 0 1 0 9.75 9.75.75.75 0 0 0-.75-.8H12V3.8a.75.75 0 0 0-.8-.75Z"
            fill={color}
          />
          <Path
            d="M14 2.75a.75.75 0 0 1 .85-.74 9.03 9.03 0 0 1 7.14 7.14.75.75 0 0 1-.74.85H14.75a.75.75 0 0 1-.75-.75V2.75Z"
            fill={color}
          />
        </Svg>
      ) : (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M11.5 3.1A8.5 8.5 0 1 0 20.9 12.5H12a.5.5 0 0 1-.5-.5V3.1Z"
            stroke={color}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
          <Path
            d="M14.3 2.55a8.5 8.5 0 0 1 7.15 7.15H14.3V2.55Z"
            stroke={color}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'split':
      return focused ? (
        <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
          <Circle cx={9.5} cy={7.5} r={3.5} fill={color} />
          <Path
            d="M2.5 19.5c0-3.2 3.1-5.5 7-5.5s7 2.3 7 5.5c0 .55-.45 1-1 1h-12c-.55 0-1-.45-1-1Z"
            fill={color}
          />
          <Circle cx={17} cy={8.5} r={2.6} fill={color} />
          <Path
            d="M16.5 14.3c2.7.35 5 2.05 5 4.9 0 .45-.35.8-.8.8H18c.08-.2.1-.4.1-.6 0-2.1-1-3.95-2.6-5.05.33-.05.66-.07 1-.05Z"
            fill={color}
          />
        </Svg>
      ) : (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Circle cx={9.5} cy={7.5} r={3.3} stroke={color} strokeWidth={1.8} />
          <Path
            d="M3 19.5c0-3 2.9-5 6.5-5s6.5 2 6.5 5"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          <Circle cx={16.8} cy={8.5} r={2.4} stroke={color} strokeWidth={1.7} />
          <Path
            d="M16.8 14.5c2.45.4 4.35 2 4.35 4.8"
            stroke={color}
            strokeWidth={1.7}
            strokeLinecap="round"
          />
        </Svg>
      );

    case 'profile':
      return focused ? (
        <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={7.5} r={4} fill={color} />
          <Path
            d="M4 19.5c0-3.6 3.6-6 8-6s8 2.4 8 6c0 .83-.67 1.5-1.5 1.5h-13c-.83 0-1.5-.67-1.5-1.5Z"
            fill={color}
          />
        </Svg>
      ) : (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={7.5} r={3.8} stroke={color} strokeWidth={1.8} />
          <Path
            d="M4.5 20c0-3.3 3.35-5.5 7.5-5.5s7.5 2.2 7.5 5.5"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </Svg>
      );
  }
}

function TabPillIcon({ name, color, focused, activeBg, cutoutColor }: TabIconProps) {
  return (
    <View
      style={{
        width: 46,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? activeBg : 'transparent',
      }}
    >
      <TabVectorIcon name={name} color={color} focused={focused} cutoutColor={cutoutColor} />
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useAppTheme();
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

  // Ensure bottom navigation bar on Android (3-button or gesture bar) and iOS home indicator
  // have adequate padding so tab icons and labels are never overlapped.
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 4);
  const tabHeight = 54 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tabHeight,
          paddingTop: 4,
          paddingBottom: bottomInset,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabPillIcon
              name="home"
              color={color}
              focused={focused}
              activeBg={colors.primaryMuted}
              cutoutColor={colors.surface}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, focused }) => (
            <TabPillIcon
              name="transactions"
              color={color}
              focused={focused}
              activeBg={colors.primaryMuted}
              cutoutColor={colors.surface}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Budgets',
          tabBarIcon: ({ color, focused }) => (
            <TabPillIcon
              name="budgets"
              color={color}
              focused={focused}
              activeBg={colors.primaryMuted}
              cutoutColor={colors.surface}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="split"
        options={{
          title: 'Split',
          tabBarIcon: ({ color, focused }) => (
            <TabPillIcon
              name="split"
              color={color}
              focused={focused}
              activeBg={colors.primaryMuted}
              cutoutColor={colors.surface}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabPillIcon
              name="profile"
              color={color}
              focused={focused}
              activeBg={colors.primaryMuted}
              cutoutColor={colors.surface}
            />
          ),
        }}
      />
    </Tabs>
  );
}
