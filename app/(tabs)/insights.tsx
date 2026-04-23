import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { habitLogs, habits, targets } from '../../db/schema';
import { useAppTheme } from '../../components/theme-context';
import { getPalette, spacing } from '../../constants/design-system';
import { createSharedStyles } from '../../components/ui/shared-styles';
import { getCurrentUser } from '../../db/auth';

type HabitChartItem = {
  habitName: string;
  totalValue: number;
};

type InsightsData = {
  totalHabits: number;
  totalLogs: number;
  totalTargets: number;
  totalLoggedValue: number;
  chartData: HabitChartItem[];
};

    export default function InsightsScreen() {
      // Keep summary stats and chart rows in one state object since they come from the same DB load.
      const [insights, setInsights] = useState<InsightsData>({
        totalHabits: 0,
        totalLogs: 0,
        totalTargets: 0,
        totalLoggedValue: 0,
        chartData: [],
      });
      const { isDark } = useAppTheme();
      const palette = getPalette(isDark);
      const sharedStyles = createSharedStyles(palette, isDark);

      const chartBackgroundColor = palette.surfaceAlt;

  // Reload on focus so this dashboard reflects latest habits/logs/targets activity.
  // Reference: https://reactnavigation.org/docs/use-focus-effect
  useFocusEffect(
    useCallback(() => {
      loadInsights();
    }, [])
  );

    // DB reads are kept together here so totals and chart values stay in sync.
    const loadInsights = async () => {
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        setInsights({
          totalHabits: 0,
          totalLogs: 0,
          totalTargets: 0,
          totalLoggedValue: 0,
          chartData: [],
        });
        return;
      }

    const savedHabits = await db
      .select()
      .from(habits)
      .where(eq(habits.userId, currentUser.id));
    const savedLogs = await db
      .select()
      .from(habitLogs)
      .where(eq(habitLogs.userId, currentUser.id));
    const savedTargets = await db
      .select()
      .from(targets)
      .where(eq(targets.userId, currentUser.id));

    const totalLoggedValue = savedLogs.reduce((sum, log) => sum + log.value, 0);

    // Group values by habit for a quick visual comparison without adding a full chart library.
    const chartData: HabitChartItem[] = savedHabits.map((habit) => {
      const relatedLogs = savedLogs.filter((log) => log.habitId === habit.id);
      const totalValue = relatedLogs.reduce((sum, log) => sum + log.value, 0);

      return {
        habitName: habit.name,
        totalValue,
      };
    });

    setInsights({
      totalHabits: savedHabits.length,
      totalLogs: savedLogs.length,
      totalTargets: savedTargets.length,
      totalLoggedValue,
      chartData,
    });
  };

  const maxValue =
    insights.chartData.length > 0
      ? Math.max(...insights.chartData.map((item) => item.totalValue), 1)
      : 1;

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.screenContent}>
      <Text style={sharedStyles.title}>Insights</Text>
      <Text style={sharedStyles.subtitle}>Overview of your habit tracking data</Text>

      {/* Four small summary cards make the dashboard readable at a glance. */}
      {/* Styling idea inspired by: https://reactnativeelements.com/docs/components/card */}
      <View style={styles.statsGrid}>
        <View style={[sharedStyles.card, styles.statCard]}>
          <Text style={[styles.cardTitle, { color: palette.textMuted }]}>Total Habits</Text>
          <Text style={[styles.cardValue, { color: palette.text }]}>{insights.totalHabits}</Text>
        </View>

        <View style={[sharedStyles.card, styles.statCard]}>
          <Text style={[styles.cardTitle, { color: palette.textMuted }]}>Total Logs</Text>
          <Text style={[styles.cardValue, { color: palette.text }]}>{insights.totalLogs}</Text>
        </View>

        <View style={[sharedStyles.card, styles.statCard]}>
          <Text style={[styles.cardTitle, { color: palette.textMuted }]}>Total Targets</Text>
          <Text style={[styles.cardValue, { color: palette.text }]}>{insights.totalTargets}</Text>
        </View>

        <View style={[sharedStyles.card, styles.statCard]}>
          <Text style={[styles.cardTitle, { color: palette.textMuted }]}>Total Logged Value</Text>
          <Text style={[styles.cardValue, { color: palette.text }]}>{insights.totalLoggedValue}</Text>
        </View>
      </View>

      {/* The chart area stays simple on purpose: quick trend check no heavy UI dependency. */}
      <View style={[sharedStyles.card, styles.chartCard]}>
        <Text style={sharedStyles.sectionTitle}>Logged Value by Habit</Text>

        {insights.chartData.length === 0 ? (
          <Text style={sharedStyles.emptyText}>No chart data available yet</Text>
        ) : (
          insights.chartData.map((item) => {
            const barWidth = `${(item.totalValue / maxValue) * 100}%` as `${number}%`;

            return (
              <View key={item.habitName} style={styles.chartRow}>
                <Text style={[styles.chartLabel, { color: palette.text }]}>{item.habitName}</Text>
                {/* Inspired by: https://reactnative.dev/docs/view */}
                <View
                  style={[
                    styles.barBackground,
                    { backgroundColor: chartBackgroundColor },
                  ]}
                >
                  {/* Reference: https://oss.callstack.com/react-native-paper/4.0/progress-bar.html */}
                  <View style={[styles.barFill, { width: barWidth }]} />
                </View>
                <Text style={[styles.chartValue, { color: palette.textMuted }]}>{item.totalValue}</Text>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

    // Simple styling for summary cards and chart bars
    const styles = StyleSheet.create({
      statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      },
      statCard: {
        width: '48%',
        minHeight: 120,
        justifyContent: 'space-between',
      },
      chartCard: {
        marginTop: spacing.sm,
      },
      cardTitle: {
        fontSize: 14,
        marginBottom: 6,
      },
      cardValue: {
        fontSize: 30,
        fontWeight: 'bold',
      },
      chartRow: {
        marginTop: 12,
      },
      chartLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
      },
      barBackground: {
        height: 18,
        borderRadius: 6,
        overflow: 'hidden',
      },
      barFill: {
        height: '100%',
        backgroundColor: '#2563eb',
        borderRadius: 6,
      },
      chartValue: {
        marginTop: 4,
        fontSize: 13,
      },
    });