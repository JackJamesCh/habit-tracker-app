import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../../db/client';
import { habitLogs, habits, targets } from '../../db/schema';
import { useAppTheme } from '../../components/theme-context';

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
  // State stores the dashboard summary and simple chart data
  // The screen reloads whenever the user opens this tab
  const [insights, setInsights] = useState<InsightsData>({
    totalHabits: 0,
    totalLogs: 0,
    totalTargets: 0,
    totalLoggedValue: 0,
    chartData: [],
  });
  const { isDark } = useAppTheme();

  const backgroundColor = isDark ? '#111827' : '#f5f5f5';
  const cardColor = isDark ? '#1f2937' : '#ffffff';
  const textColor = isDark ? '#f9fafb' : '#000000';
  const subTextColor = isDark ? '#d1d5db' : '#444444';
  const chartBackgroundColor = isDark ? '#374151' : '#e5e7eb';

  useFocusEffect(
    useCallback(() => {
      loadInsights();
    }, [])
  );

  const loadInsights = async () => {
    const savedHabits = await db.select().from(habits);
    const savedLogs = await db.select().from(habitLogs);
    const savedTargets = await db.select().from(targets);

    const totalLoggedValue = savedLogs.reduce((sum, log) => sum + log.value, 0);

    // This groups log values by habit so they can be shown in a simple bar chart
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
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>Insights</Text>
      <Text style={[styles.subtitle, { color: subTextColor }]}>
        Overview of your habit tracking data
      </Text>

      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.cardTitle, { color: subTextColor }]}>Total Habits</Text>
        <Text style={[styles.cardValue, { color: textColor }]}>
          {insights.totalHabits}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.cardTitle, { color: subTextColor }]}>Total Logs</Text>
        <Text style={[styles.cardValue, { color: textColor }]}>
          {insights.totalLogs}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.cardTitle, { color: subTextColor }]}>Total Targets</Text>
        <Text style={[styles.cardValue, { color: textColor }]}>
          {insights.totalTargets}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.cardTitle, { color: subTextColor }]}>
          Total Logged Value
        </Text>
        <Text style={[styles.cardValue, { color: textColor }]}>
          {insights.totalLoggedValue}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.cardTitle, { color: subTextColor }]}>
          Logged Value by Habit
        </Text>

        {insights.chartData.length === 0 ? (
          <Text style={[styles.emptyText, { color: subTextColor }]}>
            No chart data available yet
          </Text>
        ) : (
          insights.chartData.map((item) => {
            const barWidth = `${(item.totalValue / maxValue) * 100}%` as `${number}%`;

            return (
              <View key={item.habitName} style={styles.chartRow}>
                <Text style={[styles.chartLabel, { color: textColor }]}>
                  {item.habitName}
                </Text>
                <View
                  style={[
                    styles.barBackground,
                    { backgroundColor: chartBackgroundColor },
                  ]}
                >
                  <View style={[styles.barFill, { width: barWidth }]} />
                </View>
                <Text style={[styles.chartValue, { color: subTextColor }]}>
                  {item.totalValue}
                </Text>
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
  container: {
    padding: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 20,
  },
  card: {
    padding: 18,
    borderRadius: 10,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  emptyText: {
    marginTop: 8,
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