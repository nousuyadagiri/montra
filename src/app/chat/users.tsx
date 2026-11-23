import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Users, MessageCircle } from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useDemoStore } from '../../store/demoStore';
import { supabase } from '../../lib/supabase';
import { chatService, UserDirectoryItem, isValidUUID } from '../../services/chatService';
import { DEMO_USERS } from '../../services/demoData';
import { SearchBar } from '../../components/ui/SearchBar';
import { EmptyState } from '../../components/ui/EmptyState';
import { BorderRadius } from '../../theme/tokens';
import { toast } from '../../store/toastStore';

export default function UsersDirectoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const isDemo = !user;

  const getOrCreateDemoDirectConversation = useDemoStore(
    (s) => s.getOrCreateDemoDirectConversation
  );

  const [users, setUsers] = useState<UserDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingUserId, setOpeningUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = useCallback(async () => {
    if (isDemo) {
      const demoItems: UserDirectoryItem[] = DEMO_USERS.map((u, i) => ({
        profile: u,
        isOnline: i === 0 || i === 2,
        lastSeenAt: new Date(Date.now() - 1000 * 60 * (i * 15)).toISOString(),
      }));
      setUsers(demoItems);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch only real registered users from Supabase profiles
      const data = await chatService.getUsersDirectory(user!.id, searchQuery);
      setUsers(data);
    } catch (err) {
      console.warn('Failed to fetch directory users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [isDemo, user, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleSelectUser = async (targetUserId: string, userName?: string) => {
    if (openingUserId) return;
    try {
      setOpeningUserId(targetUserId);

      // If user is not logged in or target is demo/group-member ID
      if (isDemo || !isValidUUID(targetUserId)) {
        const convId = getOrCreateDemoDirectConversation(targetUserId, userName, user?.id);
        router.replace(`/chat/${convId}`);
        return;
      }

      // Valid registered Supabase user
      try {
        const convId = await chatService.getOrCreateDirectConversation(user!.id, targetUserId);
        router.replace(`/chat/${convId}`);
      } catch (err) {
        console.warn('Supabase getOrCreateDirectConversation error, fallback to local:', err);
        const convId = getOrCreateDemoDirectConversation(targetUserId, userName, user?.id);
        router.replace(`/chat/${convId}`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Unable to open conversation');
    } finally {
      setOpeningUserId(null);
    }
  };

  const handleStartChatWithName = async (nameOrEmail: string) => {
    if (!nameOrEmail.trim() || openingUserId) return;
    const cleanName = nameOrEmail.trim();

    try {
      setOpeningUserId('custom-new');

      // Check if this matches a registered user in Supabase by name or email
      if (user?.id) {
        try {
          const { data: matchedProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .neq('id', user.id)
            .or(`full_name.ilike.%${cleanName}%,email.ilike.%${cleanName}%`)
            .limit(1);

          if (matchedProfiles && matchedProfiles.length > 0) {
            const matched = matchedProfiles[0];
            const convId = await chatService.getOrCreateDirectConversation(user.id, matched.id);
            router.replace(`/chat/${convId}`);
            return;
          }
        } catch {
          // ignore error
        }
      }

      // If not yet registered or fallback: create a direct conversation with that member's name
      const convId = getOrCreateDemoDirectConversation(
        cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        cleanName,
        user?.id
      );
      router.replace(`/chat/${convId}`);
    } catch (err: any) {
      toast.error(err?.message || 'Unable to start chat');
    } finally {
      setOpeningUserId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.profile.full_name?.toLowerCase().includes(q) ||
        u.profile.email?.toLowerCase().includes(q) ||
        u.subtitle?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const trimmedSearch = searchQuery.trim();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 8),
            backgroundColor: isDark ? colors.background : '#FFFFFF',
            borderBottomColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDark ? colors.elevatedSurface : '#F3F4F6' }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={colors.mainText} />
        </TouchableOpacity>

        <View style={styles.headerTitleColumn}>
          <Text style={[styles.headerTitle, { color: colors.mainText }]}>
            New Conversation
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.secondaryText }]}>
            Search registered Montra members
          </Text>
        </View>

        <View style={{ width: 36 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name or email..."
        />
      </View>

      {/* Quick Direct Message Action when searching */}
      {trimmedSearch.length > 0 && (
        <View style={styles.quickStartWrap}>
          <TouchableOpacity
            style={[
              styles.quickStartCard,
              {
                backgroundColor: colors.primaryMuted,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => handleStartChatWithName(trimmedSearch)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickStartIcon, { backgroundColor: colors.primary }]}>
              <MessageCircle size={18} color={colors.onPrimary} />
            </View>
            <View style={styles.quickStartTextCol}>
              <Text style={[styles.quickStartTitle, { color: colors.mainText }]}>
                Chat with &quot;{trimmedSearch}&quot;
              </Text>
              <Text style={[styles.quickStartSub, { color: colors.secondaryText }]}>
                Tap to send a private message directly
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* User List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.profile.id}
        renderItem={({ item }) => {
          const initials =
            item.profile.full_name
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase() || '')
              .join('') || 'U';

          const isOpening = openingUserId === item.profile.id;

          return (
            <TouchableOpacity
              style={[
                styles.userCard,
                {
                  backgroundColor: isDark ? colors.elevatedSurface : colors.surface,
                  borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
              onPress={() => handleSelectUser(item.profile.id, item.profile.full_name)}
              disabled={Boolean(openingUserId)}
              activeOpacity={0.75}
            >
              <View style={styles.avatarWrapper}>
                <View
                  style={[
                    styles.avatarCircle,
                    { backgroundColor: isDark ? '#2A2A30' : '#F0F0F4' },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarText,
                      { color: isDark ? '#FFFFFF' : colors.mainText },
                    ]}
                  >
                    {initials}
                  </Text>
                </View>

                {item.isOnline && (
                  <View
                    style={[
                      styles.onlineDot,
                      {
                        backgroundColor: colors.positive,
                        borderColor: isDark ? colors.elevatedSurface : colors.surface,
                      },
                    ]}
                  />
                )}
              </View>

              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.mainText }]} numberOfLines={1}>
                  {item.profile.full_name}
                </Text>
                <Text style={[styles.userStatus, { color: colors.secondaryText }]}>
                  {item.subtitle || (item.isOnline ? 'Online now' : 'Registered Member')}
                </Text>
              </View>

              {isOpening ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <View style={[styles.chatActionPill, { backgroundColor: colors.primaryMuted }]}>
                  <Text style={[styles.chatActionText, { color: colors.primary }]}>
                    Chat
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              illustration={<Users size={64} color={colors.secondaryText} />}
              title={trimmedSearch ? 'User Not Found' : 'No Members Found'}
              description={
                trimmedSearch
                  ? `"${trimmedSearch}" is not registered in Montra yet. You can still message them directly!`
                  : 'No other registered members or group friends found yet.'
              }
              actionTitle={trimmedSearch ? `Start Chat with "${trimmedSearch}"` : undefined}
              onAction={trimmedSearch ? () => handleStartChatWithName(trimmedSearch) : undefined}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleColumn: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  quickStartWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  quickStartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 12,
  },
  quickStartIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStartTextCol: {
    flex: 1,
  },
  quickStartTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  quickStartSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 12,
  },
  chatActionPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  chatActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
