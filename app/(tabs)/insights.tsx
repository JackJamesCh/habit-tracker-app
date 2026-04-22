import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../../db/client';
import { habitLogs, habits, targets } from '../../db/schema';

type InsightsData = {
  totalHabits: number;
  totalLogs: number;
  totalTargets: number;
  totalLoggedValue: number;
};

export default function InsightsScreen() {
  // State stores the summary values shown on the dashboard
  // The screen reloads whenever the user opens this tab
  const [insights, setInsights] = useState<InsightsData>({
    totalHabits: 0,
    totalLogs: 0,
    totalTargets: 0,
    totalLoggedValue: 0,
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

    setInsights({
      totalHabits: savedHabits.length,
      totalLogs: savedLogs.length,
      totalTargets: savedTargets.length,
      totalLoggedValue,
    });
  };

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
    </ScrollView>
  );
}

// Simple styling for the dashboard cards
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
});