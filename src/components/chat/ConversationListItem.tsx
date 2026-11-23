import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Users, CheckCircle2, Clock } from 'lucide-react-native';
import { Conversation } from '../../types/database';
import { useAppTheme } from '../../store/themeStore';
import { BorderRadius, Spacing } from '../../theme/tokens';

export interface ConversationListItemProps {
  conversation: Conversation;
  currentUserId: string;
  onPress: () => void;
  isOnline?: boolean;
}

const formatChatTime = (timestamp?: string) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const ConversationListItem: React.FC<ConversationListItemProps> = ({
  conversation,
  currentUserId,
  onPress,
  isOnline = false,
}) => {
  const { colors, isDark } = useAppTheme();
  const isGroup = conversation.type === 'group';

  const title =
    conversation.title ||
    (isGroup
      ? conversation.group?.name || 'Group Chat'
      : conversation.other_participant?.full_name || 'Direct Chat');

  const initials = title
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || 'C';

  const unreadCount = conversation.unread_count || 0;
  const timeFormatted = formatChatTime(conversation.last_message_at);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.elevatedSurface : colors.surface,
          borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.05)',
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        <View
          style={[
            styles.avatarCircle,
            {
              backgroundColor: isGroup
                ? colors.primaryMuted
                : isDark
                ? '#2A2A30'
                : '#F0F0F4',
            },
          ]}
        >
          {isGroup ? (
            <Users size={20} color={colors.primary} />
          ) : (
            <Text
              style={[
                styles.avatarText,
                { color: isDark ? '#FFFFFF' : colors.mainText },
              ]}
            >
              {initials}
            </Text>
          )}
        </View>

        {!isGroup && isOnline && (
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

      {/* Info */}
      <View style={styles.contentColumn}>
        <View style={styles.topRow}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.nameText,
                { color: colors.mainText, fontWeight: unreadCount > 0 ? '700' : '600' },
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {isGroup && (
              <View style={[styles.groupBadge, { backgroundColor: colors.primaryMuted }]}>
                <Text style={[styles.groupBadgeText, { color: colors.primary }]}>Group</Text>
              </View>
            )}
          </View>
          <Text style={[styles.timeText, { color: colors.secondaryText }]}>
            {timeFormatted}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text
            style={[
              styles.previewText,
              {
                color: unreadCount > 0 ? colors.mainText : colors.secondaryText,
                fontWeight: unreadCount > 0 ? '600' : '400',
              },
            ]}
            numberOfLines={1}
          >
            {conversation.last_message_preview || 'No messages yet'}
          </Text>

          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.unreadText, { color: colors.onPrimary }]}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  contentColumn: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    paddingRight: 8,
  },
  nameText: {
    fontSize: 15,
    letterSpacing: -0.2,
  },
  groupBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  groupBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  timeText: {
    fontSize: 11,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  previewText: {
    fontSize: 13,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
});

