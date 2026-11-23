import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, CheckCheck, Clock } from 'lucide-react-native';
import { Message, MoneyRequestStatus } from '../../types/database';
import { useAppTheme } from '../../store/themeStore';
import { BorderRadius } from '../../theme/tokens';
import { MoneyRequestCard } from './MoneyRequestCard';
import { PaymentUpdateCard } from './PaymentUpdateCard';
import { ExpenseNotificationCard } from './ExpenseNotificationCard';

export interface ChatMessageBubbleProps {
  message: Message;
  currentUserId: string;
  isGroup?: boolean;
  onRespondMoneyRequest?: (requestId: string, action: MoneyRequestStatus) => Promise<void>;
}

const formatMessageTime = (isoString?: string) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  currentUserId,
  isGroup = false,
  onRespondMoneyRequest,
}) => {
  const { colors, isDark } = useAppTheme();
  const isSender =
    (Boolean(currentUserId) && message.sender_id === currentUserId) ||
    (!currentUserId && message.sender_id === 'demo-user-alex-morgan') ||
    (currentUserId === 'demo-user-alex-morgan' && message.sender_id === 'demo-user-alex-morgan') ||
    message.sender_id === 'me';
  const timeFormatted = formatMessageTime(message.created_at);

  if (message.message_type === 'system') {
    return (
      <View style={styles.systemMessageContainer}>
        <View
          style={[
            styles.systemPill,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' },
          ]}
        >
          <Text style={[styles.systemText, { color: colors.secondaryText }]}>
            {message.content}
          </Text>
        </View>
      </View>
    );
  }

  const renderContent = () => {
    switch (message.message_type) {
      case 'money_request':
        return (
          <MoneyRequestCard
            metadata={message.metadata as any}
            isSender={isSender}
            currentUserId={currentUserId}
            onRespond={
              onRespondMoneyRequest
                ? (action) =>
                    onRespondMoneyRequest(
                      (message.metadata as any)?.request_id || message.id,
                      action
                    )
                : undefined
            }
          />
        );
      case 'payment_update':
        return (
          <PaymentUpdateCard
            metadata={message.metadata as any}
            isSender={isSender}
          />
        );
      case 'expense_notification':
        return (
          <ExpenseNotificationCard
            metadata={message.metadata as any}
          />
        );
      case 'text':
      default:
        return (
          <Text
            style={[
              styles.messageText,
              {
                color: isSender
                  ? colors.onPrimary
                  : colors.mainText,
              },
            ]}
          >
            {message.content}
          </Text>
        );
    }
  };

  const isFinancialCard =
    message.message_type === 'money_request' ||
    message.message_type === 'payment_update' ||
    message.message_type === 'expense_notification';

  return (
    <View
      style={[
        styles.rowWrapper,
        isSender ? styles.senderRow : styles.receiverRow,
      ]}
    >
      <View style={[styles.bubbleCol, isSender ? styles.senderCol : styles.receiverCol]}>
        {/* In group chats, display sender's name for other participants */}
        {isGroup && !isSender && message.sender?.full_name && (
          <Text style={[styles.senderNameHeader, { color: colors.secondaryText }]}>
            {message.sender.full_name}
          </Text>
        )}

        <View
          style={[
            styles.bubble,
            isFinancialCard && styles.transparentBubble,
            !isFinancialCard && isSender
              ? [styles.senderBubble, { backgroundColor: colors.primary }]
              : !isFinancialCard && [
                  styles.receiverBubble,
                  {
                    backgroundColor: isDark ? colors.elevatedSurface : colors.surface,
                    borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.06)',
                  },
                ],
          ]}
        >
          {renderContent()}

          {/* Timestamp and delivery receipts */}
          <View style={styles.metaRow}>
            <Text
              style={[
                styles.timeText,
                {
                  color: isFinancialCard
                    ? colors.secondaryText
                    : isSender
                    ? 'rgba(255, 255, 255, 0.75)'
                    : colors.secondaryText,
                },
              ]}
            >
              {timeFormatted}
            </Text>

            {isSender && (
              <View style={styles.tickWrapper}>
                {message.status === 'read' ? (
                  <CheckCheck size={13} color={isDark ? '#60A5FA' : '#93C5FD'} strokeWidth={2.4} />
                ) : message.status === 'delivered' ? (
                  <CheckCheck size={13} color="rgba(255, 255, 255, 0.7)" strokeWidth={2} />
                ) : message.status === 'sending' ? (
                  <Clock size={11} color="rgba(255, 255, 255, 0.6)" strokeWidth={2} />
                ) : (
                  <Check size={13} color="rgba(255, 255, 255, 0.7)" strokeWidth={2} />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rowWrapper: {
    marginVertical: 3,
    paddingHorizontal: 12,
    flexDirection: 'row',
    width: '100%',
  },
  senderRow: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  receiverRow: {
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
  bubbleCol: {
    maxWidth: '85%',
  },
  senderCol: {
    alignItems: 'flex-end',
  },
  receiverCol: {
    alignItems: 'flex-start',
  },
  senderNameHeader: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    marginLeft: 6,
  },
  bubble: {
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  transparentBubble: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  senderBubble: {
    borderBottomRightRadius: 4,
  },
  receiverBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 14.5,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 3,
  },
  timeText: {
    fontSize: 10,
  },
  tickWrapper: {
    marginLeft: 2,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 24,
  },
  systemPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  systemText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});
