import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { useAppTheme } from '../../store/themeStore';
import { Text } from './Typography';
import { Spacing, BorderRadius } from '../../theme/tokens';

interface TrendItem {
  month: string;
  income: number;
  expense: number;
}

interface IncomeExpenseChartProps {
  data: TrendItem[];
  height?: number;
}

export const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({
  data,
  height = 148,
}) => {
  const { colors, isDark } = useAppTheme();
  const screenWidth = Dimensions.get('window').width - Spacing.lg * 2 - Spacing.lg * 2;
  const chartWidth = Math.max(screenWidth, 280);

  const hasData = data && data.some((d) => d.income > 0 || d.expense > 0);
  if (!hasData) {
    return (
      <View style={[styles.emptyContainer, { height: Math.max(height - 10, 80) }]}>
        <Text variant="xs" color="secondary" style={{ textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 }}>
          No trend data recorded yet.{'\n'}Log income & expenses to see your 6-month visual comparison.
        </Text>
      </View>
    );
  }

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income, d.expense)),
    1000
  );

  const paddingTop = 12;
  const paddingBottom = 24;
  const chartHeight = height - paddingTop - paddingBottom;
  const groupWidth = chartWidth / data.length;
  const barWidth = Math.max(8, groupWidth * 0.22);
  const barGap = 4;

  return (
    <View style={styles.container}>
      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.positive }]} />
          <Text variant="xs" color="secondary" weight="semibold" style={{ fontSize: 11 }}>
            Income
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.negative }]} />
          <Text variant="xs" color="secondary" weight="semibold" style={{ fontSize: 11 }}>
            Expense
          </Text>
        </View>
      </View>

      <Svg width={chartWidth} height={height}>
        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((pct, idx) => {
          const y = paddingTop + chartHeight * (1 - pct);
          return (
            <Line
              key={idx}
              x1={0}
              y1={y}
              x2={chartWidth}
              y2={y}
              stroke={colors.borderLight}
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          );
        })}

        {/* Bars */}
        {data.map((item, idx) => {
          const groupCenterX = idx * groupWidth + groupWidth / 2;
          const incomeHeight = item.income > 0 ? Math.max(4, (item.income / maxVal) * chartHeight) : 2;
          const expenseHeight = item.expense > 0 ? Math.max(4, (item.expense / maxVal) * chartHeight) : 2;

          const incomeX = groupCenterX - barWidth - barGap / 2;
          const expenseX = groupCenterX + barGap / 2;

          const incomeY = paddingTop + chartHeight - incomeHeight;
          const expenseY = paddingTop + chartHeight - expenseHeight;

          return (
            <G key={idx}>
              {/* Income bar */}
              <Rect
                x={incomeX}
                y={incomeY}
                width={barWidth}
                height={incomeHeight}
                rx={Math.min(barWidth / 2, 4)}
                fill={item.income > 0 ? colors.positive : colors.borderLight}
                opacity={item.income > 0 ? 1 : 0.4}
              />

              {/* Expense bar */}
              <Rect
                x={expenseX}
                y={expenseY}
                width={barWidth}
                height={expenseHeight}
                rx={Math.min(barWidth / 2, 4)}
                fill={item.expense > 0 ? colors.negative : colors.borderLight}
                opacity={item.expense > 0 ? 1 : 0.4}
              />

              {/* Month label */}
              <SvgText
                x={groupCenterX}
                y={height - 6}
                fill={colors.secondaryText}
                fontSize={10}
                fontWeight="500"
                textAnchor="middle"
              >
                {item.month}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
