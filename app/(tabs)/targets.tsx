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

  const backgroundColor = isDark ? '#111827' : '#f5f5f5';
  const cardColor = isDark ? '#1f2937' : '#ffffff';
  const textColor = isDark ? '#f9fafb' : '#000000';
  const subTextColor = isDark ? '#d1d5db' : '#444444';
  const inputColor = isDark ? '#1f2937' : '#ffffff';
  const borderColor = isDark ? '#374151' : '#bbb';
  const unselectedButtonColor = isDark ? '#374151' : '#ddd';
  const buttonTextColor = isDark ? '#f9fafb' : '#000000';

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
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>Targets</Text>

      <Text style={[styles.label, { color: textColor }]}>Select Habit</Text>
      <View style={styles.row}>
        {habitList.map((habit) => (
          <TouchableOpacity
            key={habit.id}
            style={[
              styles.optionButton,
              { backgroundColor: unselectedButtonColor },
              selectedHabitId === habit.id && styles.selectedButton,
            ]}
            onPress={() => setSelectedHabitId(habit.id)}
          >
            <Text
              style={
                selectedHabitId === habit.id
                  ? styles.selectedText
                  : [styles.optionText, { color: buttonTextColor }]
              }
            >
              {habit.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: textColor }]}>Target Period</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            { backgroundColor: unselectedButtonColor },
            period === 'weekly' && styles.selectedButton,
          ]}
          onPress={() => setPeriod('weekly')}
        >
          <Text
            style={
              period === 'weekly'
                ? styles.selectedText
                : [styles.optionText, { color: buttonTextColor }]
            }
          >
            Weekly
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionButton,
            { backgroundColor: unselectedButtonColor },
            period === 'monthly' && styles.selectedButton,
          ]}
          onPress={() => setPeriod('monthly')}
        >
          <Text
            style={
              period === 'monthly'
                ? styles.selectedText
                : [styles.optionText, { color: buttonTextColor }]
            }
          >
            Monthly
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: inputColor,
            borderColor,
            color: textColor,
          },
        ]}
        placeholder="Enter target value"
        placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
        value={targetValue}
        onChangeText={setTargetValue}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.addButton} onPress={addTarget}>
        <Text style={styles.addButtonText}>Add Target</Text>
      </TouchableOpacity>

      <Text style={[styles.listTitle, { color: textColor }]}>Saved Targets</Text>

      <FlatList
        data={targetList}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: subTextColor }]}>
            No targets added yet
          </Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <Text style={[styles.cardTitle, { color: textColor }]}>{item.habitName}</Text>
            <Text style={[styles.cardText, { color: subTextColor }]}>
              Period: {item.period}
            </Text>
            <Text style={[styles.cardText, { color: subTextColor }]}>
              Target: {item.targetValue}
            </Text>
            <Text style={[styles.cardText, { color: subTextColor }]}>
              Current Progress: {item.currentValue}
            </Text>
            <Text style={[styles.cardText, { color: subTextColor }]}>
              Remaining: {item.remainingValue}
            </Text>
            <Text style={[styles.cardText, { color: subTextColor }]}>
              Status: {item.status}
            </Text>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteTarget(item.id)}
            >
              <Text style={styles.deleteButtonText}>Delete Target</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

// Basic styling for the targets screen layout
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedButton: {
    backgroundColor: '#2563eb',
  },
  optionText: {},
  selectedText: {
    color: '#fff',
  },
  input: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  addButton: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyText: {
    marginTop: 6,
  },
  card: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  cardText: {
    marginBottom: 2,
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});