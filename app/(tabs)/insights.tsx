import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../../db/client';
import { habitLogs, habits, targets } from '../../db/schema';

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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Insights</Text>
      <Text style={styles.subtitle}>Overview of your habit tracking data</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Habits</Text>
        <Text style={styles.cardValue}>{insights.totalHabits}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Logs</Text>
        <Text style={styles.cardValue}>{insights.totalLogs}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Targets</Text>
        <Text style={styles.cardValue}>{insights.totalTargets}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Logged Value</Text>
        <Text style={styles.cardValue}>{insights.totalLoggedValue}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Logged Value by Habit</Text>

        {insights.chartData.length === 0 ? (
          <Text style={styles.emptyText}>No chart data available yet</Text>
        ) : (
          insights.chartData.map((item) => {
            const barWidth = `${(item.totalValue / maxValue) * 100}%` as `${number}%`;

            return (
              <View key={item.habitName} style={styles.chartRow}>
                <Text style={styles.chartLabel}>{item.habitName}</Text>
                <View style={styles.barBackground}>
                  <View style={[styles.barFill, { width: barWidth }]} />
                </View>
                <Text style={styles.chartValue}>{item.totalValue}</Text>
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
    backgroundColor: '#f5f5f5',
    flexGrow: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 10,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#666',
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
    backgroundColor: '#e5e7eb',
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
    color: '#444',
  },
});