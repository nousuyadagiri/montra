import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Line, Circle, Text as SvgText, G } from 'react-native-svg';
import { useAppTheme } from '../../store/themeStore';
import { Text } from '../ui/Typography';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';

interface BarData {
  month: string;
  income: number;
  expense: number;
}

interface MonthlyBarChartProps {
  data: BarData[];
  height?: number;
}

export const MonthlyBarChart: React.FC<MonthlyBarChartProps> = ({ data, height = 180 }) => {
  const { colors, isDark } = useAppTheme();
  const screenWidth = Dimensions.get('window').width - Spacing.xl * 2 - Spacing.lg * 2;
  const chartWidth = Math.max(screenWidth, 280);

  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyChart, { height }]}>
        <Text variant="sm" color="secondary">
          No transaction history available yet
        </Text>
      </View>
    );
  }

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income, d.expense)),
    1000
  );

  const paddingBottom = 28;
  const paddingTop = 16;
  const chartHeight = height - paddingBottom - paddingTop;
  const groupWidth = chartWidth / data.length;
  const barWidth = Math.max(8, groupWidth * 0.28);

  return (
    <View style={styles.chartContainer}>
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
              stroke={colors.border}
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          );
        })}

        {/* Bars */}
        {data.map((item, idx) => {
          const groupX = idx * groupWidth;
          const incomeHeight = Math.max(2, (item.income / maxVal) * chartHeight);
          const expenseHeight = Math.max(2, (item.expense / maxVal) * chartHeight);

          const incomeX = groupX + groupWidth * 0.18;
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
                rx={3}
                fill={colors.success}
              />
              {/* Expense bar */}
              <Rect
                x={expenseX}
                y={expenseY}
                width={barWidth}
                height={expenseHeight}
                rx={3}
                fill={colors.error}
              />
              {/* Month label */}
              <SvgText
                x={groupX + groupWidth / 2}
                y={height - 8}
                fill={colors.secondaryText}
                fontSize={11}
                fontWeight="500"
                textAnchor="middle"
              >
                {item.month}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text variant="xs" color="secondary">
            Income
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <Text variant="xs" color="secondary">
            Expenses
          </Text>
        </View>
      </View>
    </View>
  );
};

interface CategoryProgressProps {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export const CategoryProgressRow: React.FC<CategoryProgressProps> = ({
  category,
  amount,
  percentage,
  color,
}) => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.catRow}>
      <View style={styles.catHeader}>
        <View style={styles.catTitleGroup}>
          <View style={[styles.catColorCircle, { backgroundColor: color }]} />
          <Text variant="sm" weight="medium">
            {category}
          </Text>
        </View>
        <View style={styles.catAmountGroup}>
          <Text variant="sm" weight="semibold">
            {formatCurrency(amount)}
          </Text>
          <Text variant="xs" color="secondary" style={styles.pctText}>
            ({percentage}%)
          </Text>
        </View>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.elevatedSurface }]}>
        <View
          style={[
            styles.progressBar,
            {
              backgroundColor: color,
              width: `${Math.min(100, Math.max(4, percentage))}%`,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    alignItems: 'center',
    width: '100%',
  },
  emptyChart: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl,
    marginTop: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catRow: {
    marginBottom: Spacing.md,
    width: '100%',
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catColorCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catAmountGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pctText: {
    marginLeft: 2,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
});

