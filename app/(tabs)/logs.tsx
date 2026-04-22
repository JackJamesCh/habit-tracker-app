import React, { useCallback, useState } from 'react';
import {
  SafeAreaView,
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
import { habitLogs, habits } from '../../db/schema';
import { useAppTheme } from '../../components/theme-context';

// Type for habits shown as selectable buttons
type HabitItem = {
  id: number;
  name: string;
  type: 'completed' | 'count-based';
};

// Type for logs displayed on screen
type LogItem = {
  id: number;
  habitId: number;
  habitName: string;
  date: string;
  value: number;
  notes: string | null;
};

export default function LogsScreen() {
  // State stores habits, form input, database logs, and filter values
  // The screen reloads every time the user opens the tab
  const [habitList, setHabitList] = useState<HabitItem[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [logList, setLogList] = useState<LogItem[]>([]);

  const [filterHabitId, setFilterHabitId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
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
    const savedLogs = await db.select().from(habitLogs);

    const formattedHabits: HabitItem[] = savedHabits.map((habit) => ({
      id: habit.id,
      name: habit.name,
      type: habit.type as 'completed' | 'count-based',
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

    const formattedLogs: LogItem[] = savedLogs
      .map((log) => {
        const matchedHabit = savedHabits.find((habit) => habit.id === log.habitId);

        return {
          id: log.id,
          habitId: log.habitId,
          habitName: matchedHabit ? matchedHabit.name : 'Unknown Habit',
          date: log.date,
          value: log.value,
          notes: log.notes,
        };
      })
      .reverse();

    setLogList(formattedLogs);
  };

  // Adds a new habit log into the database and reloads the list
  // It checks that a habit, date, and number value have been entered first
  const addLog = async () => {
    if (!selectedHabitId || !date.trim() || !value.trim()) return;

    const numericValue = Number(value);

    if (isNaN(numericValue)) return;

    await db.insert(habitLogs).values({
      habitId: selectedHabitId,
      date: date.trim(),
      value: numericValue,
      notes: notes.trim() ? notes.trim() : null,
    });

    setDate('');
    setValue('');
    setNotes('');
    await loadData();
  };

  // Deletes one log from the database using its id
  // This helps the user remove mistakes from the log list
  const deleteLog = async (logId: number) => {
    await db.delete(habitLogs).where(eq(habitLogs.id, logId));
    await loadData();
  };

  // Filters logs by selected habit, search text, and date range
  // Date filtering works best when dates are entered as YYYY-MM-DD
  const filteredLogs = logList.filter((log) => {
    const matchesHabit = filterHabitId ? log.habitId === filterHabitId : true;

    const searchLower = searchText.toLowerCase();
    const matchesSearch =
      log.habitName.toLowerCase().includes(searchLower) ||
      log.date.toLowerCase().includes(searchLower) ||
      (log.notes ? log.notes.toLowerCase().includes(searchLower) : false);

    const logDate = new Date(log.date);

    const matchesStartDate = startDateFilter
      ? logDate >= new Date(startDateFilter)
      : true;

    const matchesEndDate = endDateFilter
      ? logDate <= new Date(endDateFilter)
      : true;

    return matchesHabit && matchesSearch && matchesStartDate && matchesEndDate;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View>
            <Text style={[styles.title, { color: textColor }]}>Habit Logs</Text>

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

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: inputColor,
                  borderColor,
                  color: textColor,
                },
              ]}
              placeholder="Enter date (e.g. 2026-04-21)"
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={date}
              onChangeText={setDate}
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: inputColor,
                  borderColor,
                  color: textColor,
                },
              ]}
              placeholder="Enter number"
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={value}
              onChangeText={setValue}
              keyboardType="numeric"
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: inputColor,
                  borderColor,
                  color: textColor,
                },
              ]}
              placeholder="Optional notes"
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={notes}
              onChangeText={setNotes}
            />

            <TouchableOpacity style={styles.addButton} onPress={addLog}>
              <Text style={styles.addButtonText}>Add Log</Text>
            </TouchableOpacity>

            <Text style={[styles.listTitle, { color: textColor }]}>Filter Logs</Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: inputColor,
                  borderColor,
                  color: textColor,
                },
              ]}
              placeholder="Search by habit, date, or notes"
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={searchText}
              onChangeText={setSearchText}
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: inputColor,
                  borderColor,
                  color: textColor,
                },
              ]}
              placeholder="Start date (e.g. 2026-04-01)"
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={startDateFilter}
              onChangeText={setStartDateFilter}
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: inputColor,
                  borderColor,
                  color: textColor,
                },
              ]}
              placeholder="End date (e.g. 2026-04-30)"
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={endDateFilter}
              onChangeText={setEndDateFilter}
            />

            <View style={styles.row}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { backgroundColor: unselectedButtonColor },
                  filterHabitId === null && styles.selectedButton,
                ]}
                onPress={() => setFilterHabitId(null)}
              >
                <Text
                  style={
                    filterHabitId === null
                      ? styles.selectedText
                      : [styles.optionText, { color: buttonTextColor }]
                  }
                >
                  All
                </Text>
              </TouchableOpacity>

              {habitList.map((habit) => (
                <TouchableOpacity
                  key={habit.id}
                  style={[
                    styles.optionButton,
                    { backgroundColor: unselectedButtonColor },
                    filterHabitId === habit.id && styles.selectedButton,
                  ]}
                  onPress={() => setFilterHabitId(habit.id)}
                >
                  <Text
                    style={
                      filterHabitId === habit.id
                        ? styles.selectedText
                        : [styles.optionText, { color: buttonTextColor }]
                    }
                  >
                    {habit.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.listTitle, { color: textColor }]}>Recent Logs</Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: subTextColor }]}>No logs found</Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <Text style={[styles.cardTitle, { color: textColor }]}>{item.habitName}</Text>
            <Text style={[styles.cardText, { color: subTextColor }]}>
              Date: {item.date}
            </Text>
            <Text style={[styles.cardText, { color: subTextColor }]}>
              Value: {item.value}
            </Text>
            {item.notes ? (
              <Text style={[styles.cardText, { color: subTextColor }]}>
                Notes: {item.notes}
              </Text>
            ) : null}

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteLog(item.id)}
            >
              <Text style={styles.deleteButtonText}>Delete Log</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.logsListContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// Basic styling for the log screen layout and cards
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    paddingHorizontal: 20,
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
    marginHorizontal: 20,
  },
  addButton: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    marginHorizontal: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  emptyText: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  card: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    marginHorizontal: 20,
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
  logsListContent: {
    paddingBottom: 30,
  },
});