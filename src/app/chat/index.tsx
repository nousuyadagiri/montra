import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageSquarePlus, Search, ArrowLeft, Users, MessageCircle } from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useDemoStore } from '../../store/demoStore';
import { chatService, isValidUUID } from '../../services/chatService';
import { Conversation } from '../../types/database';
import { ConversationListItem } from '../../components/chat/ConversationListItem';
import { SearchBar } from '../../components/ui/SearchBar';
import { EmptyState } from '../../components/ui/EmptyState';
import { BorderRadius, Spacing } from '../../theme/tokens';

export default function ChatInboxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const isDemo = !user;

  // Demo store subscriptions
  const demoConversations = useDemoStore((s) => s.demoConversations);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'group'>('all');

  const fetchConversations = useCallback(async () => {
    if (isDemo) {
      setConversations(demoConversations as Conversation[]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const data = await chatService.getConversations(user!.id);
      // Merge active direct/local conversations created by the user
      const localConvs = (useDemoStore.getState().demoConversations as Conversation[]).filter(
        (c) =>
          c.id.startsWith('demo-conv-') ||
          c.id.startsWith('custom-') ||
          c.id.startsWith('local-') ||
          !isValidUUID(c.id)
      );

      const seen = new Set<string>();
      const merged: Conversation[] = [];
      for (const c of [...(data || []), ...localConvs]) {
        if (!seen.has(c.id)) {
          seen.add(c.id);
          merged.push(c);
        }
      }

      setConversations(merged);
    } catch (err) {
      console.warn('Failed to fetch conversations:', err);
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isDemo, user, demoConversations]);

  useEffect(() => {
    fetchConversations();

    if (!isDemo && user?.id) {
      // Subscribe to real-time conversation updates
      const unsubscribe = chatService.subscribeToConversations(user.id, () => {
        fetchConversations();
      });
      return () => {
        unsubscribe();
      };
    }
  }, [fetchConversations, isDemo, user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  // Filter conversations by tab and search query
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // Tab filter
      if (activeTab === 'direct' && c.type !== 'direct') return false;
      if (activeTab === 'group' && c.type !== 'group') return false;

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const title = (
        c.title ||
        c.other_participant?.full_name ||
        c.group?.name ||
        ''
      ).toLowerCase();
      const preview = (c.last_message_preview || '').toLowerCase();
      return title.includes(q) || preview.includes(q);
    });
  }, [conversations, activeTab, searchQuery]);

  const totalUnread = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);
  }, [conversations]);

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
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: isDark ? colors.elevatedSurface : '#F3F4F6' }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={18} color={colors.mainText} />
          </TouchableOpacity>

          <View>
            <Text style={[styles.headerTitle, { color: colors.mainText }]}>
              Messages
            </Text>
            {totalUnread > 0 && (
              <Text style={[styles.unreadCountSubtitle, { color: colors.primary }]}>
                {totalUnread} unread {totalUnread === 1 ? 'message' : 'messages'}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.newChatBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/chat/users')}
          activeOpacity={0.8}
          accessibilityLabel="Start New Chat"
        >
          <MessageSquarePlus size={18} color={colors.onPrimary} />
          <Text style={[styles.newChatBtnText, { color: colors.onPrimary }]}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search chats, contacts, expenses..."
        />
      </View>

      {/* Segment Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeTab === 'all' && [styles.segmentBtnActive, { backgroundColor: colors.primary }],
          ]}
          onPress={() => setActiveTab('all')}
        >
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === 'all' ? colors.onPrimary : colors.secondaryText },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeTab === 'direct' && [styles.segmentBtnActive, { backgroundColor: colors.primary }],
          ]}
          onPress={() => setActiveTab('direct')}
        >
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === 'direct' ? colors.onPrimary : colors.secondaryText },
            ]}
          >
            Direct
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeTab === 'group' && [styles.segmentBtnActive, { backgroundColor: colors.primary }],
          ]}
          onPress={() => setActiveTab('group')}
        >
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === 'group' ? colors.onPrimary : colors.secondaryText },
            ]}
          >
            Groups
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationListItem
            conversation={item}
            currentUserId={user?.id || 'demo-user-alex-morgan'}
            onPress={() => router.push(`/chat/${item.id}`)}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              illustration={
                activeTab === 'group' ? (
                  <Users size={64} color={colors.secondaryText} />
                ) : (
                  <MessageCircle size={64} color={colors.secondaryText} />
                )
              }
              title={
                activeTab === 'group'
                  ? 'No Group Chats Yet'
                  : activeTab === 'direct'
                  ? 'No Direct Messages'
                  : 'No Conversations Yet'
              }
              description={
                activeTab === 'group'
                  ? 'Create a split group to start chatting and splitting expenses with your group members.'
                  : 'Start a private conversation or search for registered members to send messages.'
              }
              actionTitle={activeTab === 'group' ? 'Create Split Group' : 'Start New Chat'}
              onAction={() => {
                if (activeTab === 'group') {
                  router.push('/split/create-group');
                } else {
                  router.push('/chat/users');
                }
              }}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  unreadCountSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  newChatBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  segmentBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  segmentBtnActive: {
    elevation: 2,
  },
  segmentText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
});
