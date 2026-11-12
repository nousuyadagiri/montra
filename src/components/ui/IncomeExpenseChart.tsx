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
  height = 140,
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

  const paddingTop = 8;
  const paddingBottom = 22;
  const chartHeight = height - paddingTop - paddingBottom;
  const groupWidth = chartWidth / data.length;
  const barWidth = Math.max(7, groupWidth * 0.24);

  return (
    <View style={styles.container}>
      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.positive }]} />
          <Text variant="xs" color="secondary" weight="medium" style={{ fontSize: 10 }}>
            Income
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.negative }]} />
          <Text variant="xs" color="secondary" weight="medium" style={{ fontSize: 10 }}>
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
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          );
        })}

        {/* Bars */}
        {data.map((item, idx) => {
          const groupX = idx * groupWidth;
          const incomeHeight = Math.max(2, (item.income / maxVal) * chartHeight);
          const expenseHeight = Math.max(2, (item.expense / maxVal) * chartHeight);

          const incomeX = groupX + groupWidth * 0.20;
          const expenseX = incomeX + barWidth + 3;

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
                rx={2.5}
                fill={colors.positive}
              />
              {/* Expense bar */}
              <Rect
                x={expenseX}
                y={expenseY}
                width={barWidth}
                height={expenseHeight}
                rx={2.5}
                fill={colors.negative}
              />
              {/* Month label */}
              <SvgText
                x={groupX + groupWidth / 2}
                y={height - 4}
                fill={colors.secondaryText}
                fontSize={9.5}
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
  },
  legendRow: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    gap: Spacing.md,
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
