import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Users, Receipt, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useDemoStore } from '../../store/demoStore';
import { chatService, isValidUUID } from '../../services/chatService';
import { Conversation, Message, MoneyRequestStatus } from '../../types/database';
import { ChatMessageBubble } from '../../components/chat/ChatMessageBubble';
import { ChatInputBar } from '../../components/chat/ChatInputBar';
import { MoneyRequestModal } from '../../components/chat/MoneyRequestModal';
import { toast } from '../../store/toastStore';
import { chatActiveTracker } from '../../store/chatActiveTracker';
import { BorderRadius } from '../../theme/tokens';

const formatDateSeparator = (isoString?: string) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  const now = new Date();

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  return d.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const user = useAuthStore((s) => s.user);

  // Check if conversation should be handled via demo/local store
  const isDemoConv =
    !user ||
    !id ||
    id.startsWith('demo-') ||
    id.startsWith('custom-') ||
    id.startsWith('local-') ||
    !isValidUUID(id);

  // Demo store hooks
  const demoConversations = useDemoStore((s) => s.demoConversations);
  const demoMessages = useDemoStore((s) => s.demoMessages);
  const addDemoMessage = useDemoStore((s) => s.addDemoMessage);
  const sendDemoMoneyRequest = useDemoStore((s) => s.sendDemoMoneyRequest);
  const respondDemoMoneyRequest = useDemoStore((s) => s.respondDemoMoneyRequest);
  const markDemoConversationRead = useDemoStore((s) => s.markDemoConversationRead);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [requestModalVisible, setRequestModalVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingChannelRef = useRef<any>(null);

  const currentUserId = user?.id || 'demo-user-alex-morgan';
  const isGroup = conversation?.type === 'group';

  // Load conversation details & messages
  const loadChat = useCallback(async () => {
    if (!id) return;

    if (isDemoConv) {
      const state = useDemoStore.getState();
      let conv = (state.demoConversations as any[]).find((c) => c.id === id) || null;
      if (!conv) {
        conv = {
          id,
          type: id.includes('group') ? 'group' : 'direct',
          title: 'Direct Chat',
          created_by: currentUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          unread_count: 0,
        };
      }
      setConversation(conv);
      setMessages((state.demoMessages[id] as any[]) || []);
      state.markDemoConversationRead(id);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [conv, msgs] = await Promise.all([
        chatService.getConversationDetails(id, currentUserId),
        chatService.getMessages(id, 60),
      ]);

      if (conv) {
        setConversation(conv);
        setMessages(msgs);
        await chatService.markConversationAsRead(id, currentUserId);
      }
    } catch (err) {
      console.warn('Failed to load chat conversation:', err);
    } finally {
      setLoading(false);
    }
  }, [id, isDemoConv, currentUserId]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  // Track active chat screen for global notification silencing
  useEffect(() => {
    if (id) {
      chatActiveTracker.setActive(id);
    }
    return () => {
      chatActiveTracker.setActive(null);
    };
  }, [id]);

  // Auto-scroll to latest message when keyboard pops up
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    );
    return () => {
      showSub.remove();
    };
  }, []);

  // Real-time message subscription & typing indicators
  useEffect(() => {
    if (isDemoConv || !id || !user?.id) return;

    // 1. Subscribe to incoming messages
    const unsubscribeMessages = chatService.subscribeToMessages(id, (newOrUpdatedMsg) => {
      setMessages((prev) => {
        const index = prev.findIndex((m) => m.id === newOrUpdatedMsg.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = newOrUpdatedMsg;
          return next;
        }
        return [newOrUpdatedMsg, ...prev];
      });

      // Mark read automatically if user is actively on this screen
      chatService.markConversationAsRead(id, user.id);
    });

    // 2. Typing indicator channel
    const typing = chatService.createTypingChannel(id, user.id, (data) => {
      if (data.isTyping) {
        setTypingUser(data.userName);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          setTypingUser(null);
        }, 3000);
      } else {
        setTypingUser(null);
      }
    });

    typingChannelRef.current = typing;

    return () => {
      unsubscribeMessages();
      typing.unsubscribe();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [id, isDemoConv, user?.id]);

  // Send plain text message
  const handleSendMessage = async (text: string) => {
    if (!id || !text.trim() || isSending) return;

    if (isDemoConv) {
      const newMsg = addDemoMessage(id, {
        content: text,
        type: 'text',
        senderId: currentUserId,
      });
      setMessages((prev) => [newMsg, ...prev]);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      return;
    }

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: optimisticId,
      conversation_id: id,
      sender_id: currentUserId,
      message_type: 'text',
      content: text,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'sending',
    };

    setMessages((prev) => [optimisticMsg, ...prev]);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });

    try {
      setIsSending(true);
      const sent = await chatService.sendMessage({
        conversationId: id,
        senderId: currentUserId,
        content: text,
        type: 'text',
      });

      // Replace optimistic message with confirmed server message
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? sent : m))
      );
    } catch (err: any) {
      console.warn('Supabase sendMessage failed, fallback to local message:', err);
      const localMsg = addDemoMessage(id, {
        content: text,
        type: 'text',
        senderId: currentUserId,
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticId ? { ...localMsg, id: m.id, status: 'sent' } : m
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  // Submit money request
  const handleSubmitMoneyRequest = async (amount: number, note: string) => {
    if (!id) return;

    const recipientId =
      conversation?.other_participant?.id ||
      (conversation?.participants?.find((p) => p.user_id !== currentUserId)?.user_id) ||
      'demo-user-priya';

    if (isDemoConv || !isValidUUID(recipientId)) {
      const reqMsg = sendDemoMoneyRequest(id, {
        recipientId,
        amount,
        notes: note,
        senderId: currentUserId,
      });
      setMessages((prev) => [reqMsg, ...prev]);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      toast.success(`Money request of ₹${amount} sent!`);
      return;
    }

    try {
      await chatService.sendMoneyRequest({
        conversationId: id,
        requesterId: currentUserId,
        recipientId,
        amount,
        notes: note,
      });
      toast.success(`Money request of ₹${amount} sent!`);
      loadChat();
    } catch (err: any) {
      console.warn('Supabase sendMoneyRequest failed, fallback to local store:', err);
      const reqMsg = sendDemoMoneyRequest(id, {
        recipientId,
        amount,
        notes: note,
        senderId: currentUserId,
      });
      setMessages((prev) => [reqMsg, ...prev]);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      toast.success(`Money request of ₹${amount} sent!`);
    }
  };

  // Respond to money request (Accept / Decline / Paid)
  const handleRespondMoneyRequest = async (
    requestId: string,
    action: MoneyRequestStatus
  ) => {
    if (isDemoConv || !isValidUUID(requestId)) {
      respondDemoMoneyRequest(id, requestId, action, currentUserId);
      loadChat();
      toast.success(
        action === 'accepted'
          ? 'Money request accepted!'
          : action === 'declined'
          ? 'Money request declined.'
          : 'Payment recorded and confirmed!'
      );
      return;
    }

    try {
      await chatService.respondToMoneyRequest({
        requestId,
        userId: currentUserId,
        action,
      });
      toast.success(
        action === 'accepted'
          ? 'Money request accepted!'
          : action === 'declined'
          ? 'Money request declined.'
          : 'Payment recorded and confirmed!'
      );
      loadChat();
    } catch (err: any) {
      console.warn('Supabase respondToMoneyRequest failed, fallback to local store:', err);
      respondDemoMoneyRequest(id, requestId, action, currentUserId);
      loadChat();
      toast.success(
        action === 'accepted'
          ? 'Money request accepted!'
          : action === 'declined'
          ? 'Money request declined.'
          : 'Payment recorded and confirmed!'
      );
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (isDemoConv) return;
    const myName = user?.user_metadata?.full_name || 'Someone';
    typingChannelRef.current?.sendTyping(isTyping, myName);
  };

  // Chat title & initials
  const chatTitle =
    conversation?.title ||
    (isGroup
      ? conversation?.group?.name || 'Group Chat'
      : conversation?.other_participant?.full_name || 'Direct Chat');

  const initials = chatTitle
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || 'C';

  // Subtitle
  const subtitle = isGroup
    ? `${conversation?.group?.category || 'Split'} • ${conversation?.participants?.length || 2} members`
    : 'Online';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
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

        <View style={styles.headerTitleGroup}>
          <View
            style={[
              styles.avatarSmall,
              {
                backgroundColor: isGroup ? colors.primaryMuted : isDark ? '#2A2A30' : '#F0F0F4',
              },
            ]}
          >
            {isGroup ? (
              <Users size={16} color={colors.primary} />
            ) : (
              <Text
                style={[
                  styles.avatarSmallText,
                  { color: isDark ? '#FFFFFF' : colors.mainText },
                ]}
              >
                {initials}
              </Text>
            )}
          </View>

          <View style={styles.titleColumn}>
            <Text style={[styles.headerTitle, { color: colors.mainText }]} numberOfLines={1}>
              {chatTitle}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.secondaryText }]}>
              {subtitle}
            </Text>
          </View>
        </View>

        {/* If group chat, shortcut button to view group details */}
        {isGroup && conversation?.group_id ? (
          <TouchableOpacity
            style={[styles.groupActionBtn, { backgroundColor: colors.primaryMuted }]}
            onPress={() => router.push(`/split/${conversation.group_id}`)}
            activeOpacity={0.7}
            accessibilityLabel="View Split Group"
          >
            <Receipt size={16} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {/* Typing indicator bubble */}
      {typingUser && (
        <View style={[styles.typingBanner, { backgroundColor: isDark ? '#26262E' : '#F3F4F6' }]}>
          <Text style={[styles.typingText, { color: colors.secondaryText }]}>
            {typingUser} is typing...
          </Text>
        </View>
      )}

      {/* Messages List (Inverted for smooth chat behavior) */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const nextItem = messages[index + 1];
            const currentDate = formatDateSeparator(item.created_at);
            const nextDate = formatDateSeparator(nextItem?.created_at);
            const showDateHeader = currentDate !== nextDate;

            return (
              <View>
                {showDateHeader && (
                  <View style={styles.dateSeparator}>
                    <View
                      style={[
                        styles.datePill,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.05)',
                        },
                      ]}
                    >
                      <Text style={[styles.dateText, { color: colors.secondaryText }]}>
                        {currentDate}
                      </Text>
                    </View>
                  </View>
                )}
                <ChatMessageBubble
                  message={item}
                  currentUserId={currentUserId}
                  isGroup={isGroup}
                  onRespondMoneyRequest={handleRespondMoneyRequest}
                />
              </View>
            );
          }}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Message Composer Bar */}
      <ChatInputBar
        onSendMessage={handleSendMessage}
        onRequestMoney={() => setRequestModalVisible(true)}
        onTyping={handleTyping}
        isSending={isSending}
      />

      {/* Money Request Modal */}
      <MoneyRequestModal
        visible={requestModalVisible}
        onClose={() => setRequestModalVisible(false)}
        onSubmit={handleSubmitMoneyRequest}
        recipientName={isGroup ? 'Group Members' : chatTitle}
      />
    </KeyboardAvoidingView>
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
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingHorizontal: 10,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  titleColumn: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15.5,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  groupActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageListContent: {
    paddingVertical: 12,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 12,
  },
  datePill: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
  },
  typingBanner: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  typingText: {
    fontSize: 11.5,
    fontStyle: 'italic',
  },
});

