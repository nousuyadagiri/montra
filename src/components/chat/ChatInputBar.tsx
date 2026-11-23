import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, IndianRupee } from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { BorderRadius } from '../../theme/tokens';

export interface ChatInputBarProps {
  onSendMessage: (text: string) => Promise<void>;
  onRequestMoney: () => void;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
  isSending?: boolean;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSendMessage,
  onRequestMoney,
  onTyping,
  placeholder = 'Type a message...',
  isSending = false,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setText('');
    onTyping?.(false);
    await onSendMessage(trimmed);
  };

  const handleChangeText = (val: string) => {
    setText(val);
    if (val.length > 0) {
      onTyping?.(true);
    } else {
      onTyping?.(false);
    }
  };

  const canSend = text.trim().length > 0 && !isSending;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.background : '#FFFFFF',
          borderTopColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.06)',
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      {/* Quick Action: Money Request Button */}
      <TouchableOpacity
        style={[
          styles.actionBtn,
          {
            backgroundColor: colors.primaryMuted,
          },
        ]}
        onPress={onRequestMoney}
        accessibilityLabel="Request Money"
        activeOpacity={0.7}
      >
        <IndianRupee size={18} color={colors.primary} strokeWidth={2.4} />
      </TouchableOpacity>

      {/* Input Field */}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: isDark ? colors.elevatedSurface : '#F3F4F6',
            borderColor: isFocused ? colors.primary : 'transparent',
          },
        ]}
      >
        <TextInput
          style={[
            styles.textInput,
            { color: colors.mainText },
          ]}
          value={text}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.secondaryText}
          multiline
          maxLength={1000}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onTyping?.(false);
          }}
        />
      </View>

      {/* Send Button */}
      <TouchableOpacity
        style={[
          styles.sendBtn,
          {
            backgroundColor: canSend ? colors.primary : isDark ? '#2A2A30' : '#E5E7EB',
          },
        ]}
        onPress={handleSend}
        disabled={!canSend}
        activeOpacity={0.8}
        accessibilityLabel="Send Message"
      >
        {isSending ? (
          <ActivityIndicator size="small" color={colors.onPrimary} />
        ) : (
          <Send
            size={17}
            color={canSend ? colors.onPrimary : colors.secondaryText}
            strokeWidth={2.4}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 14.5,
    padding: 0,
    margin: 0,
    textAlignVertical: 'center',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

