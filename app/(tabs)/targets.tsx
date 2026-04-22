import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { habitLogs, habits, targets } from '../../db/schema';
import { createTarget } from '../../db/targets';
import { useAppTheme } from '../../components/theme-context';
import { getPalette, spacing } from '../../constants/design-system';
import { createSharedStyles } from '../../components/ui/shared-styles';

// Type for habits shown in the target form
type HabitItem = {
  id: number;
  name: string;
};

// Type for targets shown on screen
type TargetItem = {
  id: number;
  habitId: number;
  habitName: string;
  period: 'weekly' | 'monthly';
  targetValue: number;
  currentValue: number;
  remainingValue: number;
  status: 'On Track' | 'Met' | 'Exceeded';
};

export default function TargetsScreen() {
  // State stores habits from the database and target form input
  // Targets reload whenever the user opens this tab
  const [habitList, setHabitList] = useState<HabitItem[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [targetValue, setTargetValue] = useState('');
  const [targetList, setTargetList] = useState<TargetItem[]>([]);
  const { isDark } = useAppTheme();
  const palette = getPalette(isDark);
  const sharedStyles = createSharedStyles(palette, isDark);

  const buttonTextColor = palette.text;

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const savedHabits = await db.select().from(habits);
    const savedTargets = await db.select().from(targets);
    const savedLogs = await db.select().from(habitLogs);

    const formattedHabits: HabitItem[] = savedHabits.map((habit) => ({
      id: habit.id,
      name: habit.name,
    }));

    setHabitList(formattedHabits);

    if (formattedHabits.length > 0) {
      const habitStillExists = formattedHabits.some(
        (habit) => habit.id === selectedHabitId
      );

      if (!habitStillExists) {
        setSelectedHabitId(formattedHabits[0].id);
      }
    } else {
      setSelectedHabitId(null);
    }

    const today = new Date();

    // Get start and end of current week (Monday to Sunday)
    const currentDay = today.getDay();
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - daysFromMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Get start and end of current month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const formattedTargets: TargetItem[] = savedTargets
      .map((target) => {
        const matchedHabit = savedHabits.find((habit) => habit.id === target.habitId);

        const relatedLogs = savedLogs.filter((log) => {
          if (log.habitId !== target.habitId) return false;

          const logDate = new Date(log.date);

          if (target.period === 'weekly') {
            return logDate >= startOfWeek && logDate <= endOfWeek;
          }

          if (target.period === 'monthly') {
            return logDate >= startOfMonth && logDate <= endOfMonth;
          }

          return false;
        });

        const currentValue = relatedLogs.reduce((sum, log) => sum + log.value, 0);
        const remainingValue = Math.max(target.targetValue - currentValue, 0);

        let status: 'On Track' | 'Met' | 'Exceeded' = 'On Track';

        if (currentValue === target.targetValue) {
          status = 'Met';
        } else if (currentValue > target.targetValue) {
          status = 'Exceeded';
        }

        return {
          id: target.id,
          habitId: target.habitId,
          habitName: matchedHabit ? matchedHabit.name : 'Unknown Habit',
          period: target.period as 'weekly' | 'monthly',
          targetValue: target.targetValue,
          currentValue,
          remainingValue,
          status,
        };
      })
      .reverse();

    setTargetList(formattedTargets);
  };

  // Adds a new target using the helper function in db/targets.ts
  // This keeps the database insert logic outside the screen file
  const addTarget = async () => {
    if (!selectedHabitId || !targetValue.trim()) return;

    const numericTarget = Number(targetValue);

    if (isNaN(numericTarget)) return;

    await createTarget(selectedHabitId, period, numericTarget);

    setTargetValue('');
    setPeriod('weekly');
    await loadData();
  };

  // Deletes a target from the database and reloads the list
  // This lets the user remove old or incorrect goals
  const deleteTarget = async (targetId: number) => {
    await db.delete(targets).where(eq(targets.id, targetId));
    await loadData();
  };

  return (
    <View style={sharedStyles.screen}>
      <FlatList
        data={targetList}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View style={sharedStyles.screenContent}>
            <Text style={sharedStyles.title}>Targets</Text>

            {/* Inspired by: https://reactnativecomponents.com/components/card */}
            <View style={sharedStyles.card}>
              <Text style={sharedStyles.fieldLabel}>Select Habit</Text>
              <View style={sharedStyles.rowWrap}>
                {habitList.map((habit) => (
                  <TouchableOpacity
                    key={habit.id}
                    style={[
                      sharedStyles.pillButton,
                      selectedHabitId === habit.id && sharedStyles.pillButtonActive,
                    ]}
                    onPress={() => setSelectedHabitId(habit.id)}
                  >
                    <Text
                      style={
                        selectedHabitId === habit.id
                          ? sharedStyles.pillButtonTextActive
                          : [sharedStyles.pillButtonText, { color: buttonTextColor }]
                      }
                    >
                      {habit.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={sharedStyles.fieldLabel}>Target Period</Text>
              <View style={sharedStyles.rowWrap}>
                <TouchableOpacity
                  style={[
                    sharedStyles.pillButton,
                    period === 'weekly' && sharedStyles.pillButtonActive,
                  ]}
                  onPress={() => setPeriod('weekly')}
                >
                  <Text
                    style={
                      period === 'weekly'
                        ? sharedStyles.pillButtonTextActive
                        : [sharedStyles.pillButtonText, { color: buttonTextColor }]
                    }
                  >
                    Weekly
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    sharedStyles.pillButton,
                    period === 'monthly' && sharedStyles.pillButtonActive,
                  ]}
                  onPress={() => setPeriod('monthly')}
                >
                  <Text
                    style={
                      period === 'monthly'
                        ? sharedStyles.pillButtonTextActive
                        : [sharedStyles.pillButtonText, { color: buttonTextColor }]
                    }
                  >
                    Monthly
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={sharedStyles.input}
                placeholder="Enter target value"
                placeholderTextColor={palette.textMuted}
                value={targetValue}
                onChangeText={setTargetValue}
                keyboardType="numeric"
              />

              {/* Inspired by: https://reactnativecomponents.com/components/button */}
              <TouchableOpacity style={sharedStyles.primaryButton} onPress={addTarget}>
                <Text style={sharedStyles.buttonTextPrimary}>Add Target</Text>
              </TouchableOpacity>
            </View>

            <Text style={sharedStyles.sectionTitle}>Saved Targets</Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={[sharedStyles.emptyText, styles.emptyText]}>No targets added yet</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.itemWrapper}>
            <View style={sharedStyles.card}>
              <Text style={[styles.cardTitle, { color: palette.text }]}>{item.habitName}</Text>
              <Text style={[styles.cardText, { color: palette.textMuted }]}>Period: {item.period}</Text>
              <Text style={[styles.cardText, { color: palette.textMuted }]}>Target: {item.targetValue}</Text>
              <Text style={[styles.cardText, { color: palette.textMuted }]}>Current Progress: {item.currentValue}</Text>
              <Text style={[styles.cardText, { color: palette.textMuted }]}>Remaining: {item.remainingValue}</Text>
              <Text style={[styles.cardText, { color: palette.textMuted }]}>Status: {item.status}</Text>

              <TouchableOpacity
                style={[sharedStyles.dangerButton, styles.deleteButton]}
                onPress={() => deleteTarget(item.id)}
              >
                <Text style={sharedStyles.buttonTextDanger}>Delete Target</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

// Basic styling for the targets screen layout
const styles = StyleSheet.create({
  emptyText: {
    marginHorizontal: spacing.xl,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  cardText: {
    marginBottom: 2,
  },
  itemWrapper: {
    paddingHorizontal: spacing.xl,
  },
  deleteButton: {
    marginTop: 10,
  },
});