import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Check } from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { Text } from './Typography';
import { Spacing, BorderRadius } from '../../theme/tokens';

interface DatePickerFieldProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  helperText?: string;
  maxDate?: string;
  minDate?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const padZero = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr || 'Select date';
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  const dateObj = new Date(year, month, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const target = new Date(dateObj);
  target.setHours(0, 0, 0, 0);

  const shortMonth = MONTH_NAMES[month]?.slice(0, 3) || '';

  if (target.getTime() === today.getTime()) {
    return `Today, ${day} ${shortMonth} ${year}`;
  }
  if (target.getTime() === yesterday.getTime()) {
    return `Yesterday, ${day} ${shortMonth} ${year}`;
  }

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = daysOfWeek[target.getDay()];
  return `${dayName}, ${day} ${shortMonth} ${year}`;
};

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label = 'Date',
  value,
  onChange,
  helperText,
}) => {
  const { colors, isDark } = useAppTheme();
  const [modalVisible, setModalVisible] = useState(false);

  // Parse initial view year & month from value or today
  const initialDate = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return { year: y, month: m - 1, day: d };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  }, [value]);

  const [viewYear, setViewYear] = useState(initialDate.year);
  const [viewMonth, setViewMonth] = useState(initialDate.month);

  const openModal = () => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
    setModalVisible(true);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formatted = `${viewYear}-${padZero(viewMonth + 1)}-${padZero(day)}`;
    onChange(formatted);
    setModalVisible(false);
  };

  const handleSetToday = () => {
    const now = new Date();
    const formatted = `${now.getFullYear()}-${padZero(now.getMonth() + 1)}-${padZero(now.getDate())}`;
    onChange(formatted);
    setModalVisible(false);
  };

  const handleSetYesterday = () => {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    const formatted = `${now.getFullYear()}-${padZero(now.getMonth() + 1)}-${padZero(now.getDate())}`;
    onChange(formatted);
    setModalVisible(false);
  };

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${padZero(now.getMonth() + 1)}-${padZero(now.getDate())}`;

  return (
    <View style={styles.container}>
      {label ? (
        <Text variant="sm" weight="semibold" color="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <TouchableOpacity
        onPress={openModal}
        activeOpacity={0.75}
        style={[
          styles.fieldCard,
          {
            backgroundColor: colors.surface,
            borderColor: isDark ? colors.border : colors.borderLight,
          },
        ]}
      >
        <View style={[styles.calendarIconBadge, { backgroundColor: colors.primaryMuted }]}>
          <CalendarIcon size={18} color={colors.primary} strokeWidth={2.2} />
        </View>

        <View style={styles.dateTextGroup}>
          <Text variant="sm" weight="bold" numberOfLines={1}>
            {formatDisplayDate(value)}
          </Text>
          <Text variant="xs" color="tertiary" style={styles.isoHint}>
            {value}
          </Text>
        </View>

        <View style={[styles.changeChip, { backgroundColor: colors.elevatedSurface }]}>
          <Text variant="xs" weight="bold" style={{ color: colors.primary, fontSize: 11 }}>
            Change
          </Text>
        </View>
      </TouchableOpacity>

      {helperText ? (
        <Text variant="xs" color="tertiary" style={styles.helperText}>
          {helperText}
        </Text>
      ) : null}

      {/* Interactive Calendar Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)}>
          <Pressable
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.surface,
                borderColor: isDark ? colors.border : colors.borderLight,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text variant="md" weight="bold">
                  Select Date
                </Text>
                <Text variant="xs" color="secondary">
                  Tap a date or quick shortcut below
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.closeBtn, { backgroundColor: colors.elevatedSurface }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color={colors.secondaryText} />
              </TouchableOpacity>
            </View>

            {/* Quick Shortcuts */}
            <View style={styles.shortcutsRow}>
              <TouchableOpacity
                onPress={handleSetToday}
                style={[
                  styles.shortcutPill,
                  {
                    backgroundColor: value === todayStr ? colors.primary : colors.elevatedSurface,
                    borderColor: value === todayStr ? colors.primary : colors.borderLight,
                  },
                ]}
              >
                {value === todayStr ? <Check size={12} color={colors.onPrimary} style={{ marginRight: 4 }} /> : null}
                <Text
                  variant="xs"
                  weight="bold"
                  style={{
                    color: value === todayStr ? colors.onPrimary : colors.mainText,
                    fontSize: 11.5,
                  }}
                >
                  Today
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSetYesterday}
                style={[styles.shortcutPill, { backgroundColor: colors.elevatedSurface, borderColor: colors.borderLight }]}
              >
                <Text variant="xs" weight="bold" style={{ color: colors.mainText, fontSize: 11.5 }}>
                  Yesterday
                </Text>
              </TouchableOpacity>
            </View>

            {/* Month & Year Navigation */}
            <View style={[styles.navRow, { backgroundColor: colors.elevatedSurface }]}>
              <TouchableOpacity
                onPress={handlePrevMonth}
                style={styles.navArrow}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ChevronLeft size={18} color={colors.mainText} />
              </TouchableOpacity>

              <Text variant="sm" weight="bold">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>

              <TouchableOpacity
                onPress={handleNextMonth}
                style={styles.navArrow}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ChevronRight size={18} color={colors.mainText} />
              </TouchableOpacity>
            </View>

            {/* Weekday Names */}
            <View style={styles.weekdaysRow}>
              {WEEKDAYS.map((w, idx) => (
                <View key={idx} style={styles.weekdayCell}>
                  <Text variant="xs" weight="bold" color="tertiary" style={styles.weekdayText}>
                    {w}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Days Grid */}
            <View style={styles.daysGrid}>
              {/* Empty leading cells */}
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <View key={`empty-${idx}`} style={styles.dayCell} />
              ))}

              {/* Day numbers */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const cellIso = `${viewYear}-${padZero(viewMonth + 1)}-${padZero(day)}`;
                const isSelected = value === cellIso;
                const isCurrentToday = cellIso === todayStr;

                return (
                  <TouchableOpacity
                    key={`day-${day}`}
                    onPress={() => handleSelectDay(day)}
                    style={[
                      styles.dayCell,
                      isSelected && {
                        backgroundColor: colors.primary,
                        borderRadius: 14,
                      },
                      !isSelected && isCurrentToday && {
                        borderColor: colors.primary,
                        borderWidth: 1.5,
                        borderRadius: 14,
                      },
                    ]}
                  >
                    <Text
                      variant="xs"
                      weight={isSelected || isCurrentToday ? 'bold' : 'medium'}
                      style={{
                        color: isSelected
                          ? colors.onPrimary
                          : isCurrentToday
                          ? colors.primary
                          : colors.mainText,
                        fontSize: 12.5,
                      }}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: 6,
    marginLeft: 2,
    fontSize: 12,
  },
  fieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.sm + 2,
  },
  calendarIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTextGroup: {
    flex: 1,
  },
  isoHint: {
    fontSize: 10.5,
    marginTop: 2,
  },
  changeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  helperText: {
    marginTop: 4,
    marginLeft: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 380,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    padding: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  shortcutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  navArrow: {
    padding: 4,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  weekdayText: {
    fontSize: 11,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
});

