import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { X, IndianRupee } from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { BorderRadius } from '../../theme/tokens';

export interface MoneyRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (amount: number, note: string) => Promise<void>;
  recipientName?: string;
}

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2000];

export const MoneyRequestModal: React.FC<MoneyRequestModalProps> = ({
  visible,
  onClose,
  onSubmit,
  recipientName,
}) => {
  const { colors, isDark } = useAppTheme();
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedAmount = parseFloat(amountStr);
  const isValid = !isNaN(parsedAmount) && parsedAmount > 0;

  const handleSubmit = async () => {
    if (!isValid || loading) return;
    setError(null);
    try {
      setLoading(true);
      await onSubmit(parsedAmount, note.trim());
      setAmountStr('');
      setNote('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit money request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={[
                styles.sheet,
                {
                  backgroundColor: isDark ? colors.elevatedSurface : '#FFFFFF',
                  borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={[styles.title, { color: colors.mainText }]}>
                    Request Money
                  </Text>
                  {recipientName && (
                    <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
                      From {recipientName}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: isDark ? '#2A2A30' : '#F3F4F6' }]}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <X size={18} color={colors.mainText} />
                </TouchableOpacity>
              </View>

              {/* Amount Input */}
              <View style={styles.amountInputRow}>
                <IndianRupee size={28} color={colors.primary} strokeWidth={2.4} />
                <TextInput
                  style={[styles.amountInput, { color: colors.mainText }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.secondaryText}
                  keyboardType="numeric"
                  value={amountStr}
                  onChangeText={(val) => {
                    setAmountStr(val.replace(/[^0-9.]/g, ''));
                    setError(null);
                  }}
                  autoFocus
                />
              </View>

              {/* Quick Chips */}
              <View style={styles.chipsRow}>
                {QUICK_AMOUNTS.map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          parsedAmount === amt
                            ? colors.primaryMuted
                            : isDark
                            ? '#2A2A30'
                            : '#F3F4F6',
                        borderColor:
                          parsedAmount === amt ? colors.primary : 'transparent',
                      },
                    ]}
                    onPress={() => setAmountStr(amt.toString())}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color:
                            parsedAmount === amt ? colors.primary : colors.mainText,
                          fontWeight: parsedAmount === amt ? '700' : '500',
                        },
                      ]}
                    >
                      ₹{amt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Note Input */}
              <View
                style={[
                  styles.noteWrapper,
                  {
                    backgroundColor: isDark ? '#202026' : '#F9FAFB',
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <TextInput
                  style={[styles.noteInput, { color: colors.mainText }]}
                  placeholder="What is this request for? (e.g. Lunch, Uber, Groceries)"
                  placeholderTextColor={colors.secondaryText}
                  value={note}
                  onChangeText={setNote}
                  maxLength={120}
                />
              </View>

              {error && <Text style={[styles.errorText, { color: colors.negative }]}>{error}</Text>}

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: isValid ? colors.primary : isDark ? '#2A2A30' : '#E5E7EB',
                  },
                ]}
                onPress={handleSubmit}
                disabled={!isValid || loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text
                    style={[
                      styles.submitBtnText,
                      { color: isValid ? colors.onPrimary : colors.secondaryText },
                    ]}
                  >
                    Send Request
                  </Text>
                )}
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  amountInput: {
    fontSize: 38,
    fontWeight: '800',
    minWidth: 120,
    textAlign: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },
  noteWrapper: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  noteInput: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  submitBtn: {
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

