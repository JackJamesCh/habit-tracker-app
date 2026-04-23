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
import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { habitLogs, habits } from '../../db/schema';
import { useAppTheme } from '../../components/theme-context';
import { getPalette, spacing } from '../../constants/design-system';
import { createSharedStyles } from '../../components/ui/shared-styles';
import { getCurrentUser } from '../../db/auth';

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
  // Keep form state, list data and filters together so this tab is easy to reason about.
  const [habitList, setHabitList] = useState<HabitItem[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [logList, setLogList] = useState<LogItem[]>([]);

  const [filterHabitId, setFilterHabitId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Theme tokens are pulled once so every row/card uses the same color set.
  const { isDark } = useAppTheme();
  const palette = getPalette(isDark);
  const sharedStyles = createSharedStyles(palette, isDark);

  const buttonTextColor = palette.text;

  // Reload on focus so newly added logs from other flows show up right away.
  // Reference: https://reactnavigation.org/docs/use-focus-effect
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // One loader keeps habits and logs in sync for both forms and filter chips.
  const loadData = async () => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      setHabitList([]);
      setLogList([]);
      setSelectedHabitId(null);
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

  const clearLogForm = () => {
    setDate('');
    setValue('');
    setNotes('');
    setEditingLogId(null);
  };

  // Same form is reused for add + edit to keep this screen compact.
  const saveLog = async () => {
    if (!selectedHabitId || !date.trim() || !value.trim()) return;

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return;
    }

    const numericValue = Number(value);

    if (isNaN(numericValue)) return;

    if (editingLogId !== null) {
      await db
        .update(habitLogs)
        .set({
          habitId: selectedHabitId,
          date: date.trim(),
          value: numericValue,
          notes: notes.trim() ? notes.trim() : null,
        })
        .where(
          and(eq(habitLogs.id, editingLogId), eq(habitLogs.userId, currentUser.id))
        );
    } else {
      await db.insert(habitLogs).values({
        userId: currentUser.id,
        habitId: selectedHabitId,
        date: date.trim(),
        value: numericValue,
        notes: notes.trim() ? notes.trim() : null,
      });
    }

    clearLogForm();
    await loadData();
  };

  // Delete then refresh so accidental entries disappear immediately in UI.
  const deleteLog = async (logId: number) => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return;
    }

    await db
      .delete(habitLogs)
      .where(and(eq(habitLogs.id, logId), eq(habitLogs.userId, currentUser.id)));

    if (editingLogId === logId) {
      clearLogForm();
    }

    await loadData();
  };

  // Prefilling makes quick corrections easier than retyping everything.
  const startEditingLog = (log: LogItem) => {
    setEditingLogId(log.id);
    setSelectedHabitId(log.habitId);
    setDate(log.date);
    setValue(log.value.toString());
    setNotes(log.notes ?? '');
  };

  // Filtering is done client side because this list is small and needs instant feedback.
  // Date range works best with ISO format (YYYY-MM-DD) which matches saved examples.
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
    <SafeAreaView style={sharedStyles.screen}>
      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View style={sharedStyles.screenContent}>
            <Text style={sharedStyles.title}>Habit Logs</Text>

            {/* Keeping add/edit controls in one card keeps the top section predictable. */}
            {/* Styling idea inspired by: https://reactnativeelements.com/docs/components/card */}
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

              <TextInput
                style={sharedStyles.input}
                placeholder="Enter date (e.g. 2026-04-21)"
                placeholderTextColor={palette.textMuted}
                value={date}
                onChangeText={setDate}
              />

              <TextInput
                style={sharedStyles.input}
                placeholder="Enter number"
                placeholderTextColor={palette.textMuted}
                value={value}
                onChangeText={setValue}
                keyboardType="numeric"
              />

              <TextInput
                style={sharedStyles.input}
                placeholder="Optional notes"
                placeholderTextColor={palette.textMuted}
                value={notes}
                onChangeText={setNotes}
              />

              {/* Reference: https://callstack.github.io/react-native-paper/docs/components/Button/ */}
              <TouchableOpacity style={sharedStyles.primaryButton} onPress={saveLog}>
                <Text style={sharedStyles.buttonTextPrimary}>
                  {editingLogId !== null ? 'Update Log' : 'Add Log'}
                </Text>
              </TouchableOpacity>

              {editingLogId !== null ? (
                <TouchableOpacity style={[sharedStyles.secondaryButton, styles.secondaryAction]} onPress={clearLogForm}>
                  <Text style={sharedStyles.buttonTextSecondary}>Cancel Edit</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={sharedStyles.card}>
              <Text style={sharedStyles.sectionTitle}>Filter Logs</Text>

              <TextInput
                style={sharedStyles.input}
                placeholder="Search by habit, date, or notes"
                placeholderTextColor={palette.textMuted}
                value={searchText}
                onChangeText={setSearchText}
              />

              <TextInput
                style={sharedStyles.input}
                placeholder="Start date (e.g. 2026-04-01)"
                placeholderTextColor={palette.textMuted}
                value={startDateFilter}
                onChangeText={setStartDateFilter}
              />

              <TextInput
                style={sharedStyles.input}
                placeholder="End date (e.g. 2026-04-30)"
                placeholderTextColor={palette.textMuted}
                value={endDateFilter}
                onChangeText={setEndDateFilter}
              />

              {/* Quick habit chips make it easier to switch filters without typing. */}
              <View style={sharedStyles.rowWrap}>
                <TouchableOpacity
                  style={[
                    sharedStyles.pillButton,
                    filterHabitId === null && sharedStyles.pillButtonActive,
                  ]}
                  onPress={() => setFilterHabitId(null)}
                >
                  <Text
                    style={
                      filterHabitId === null
                        ? sharedStyles.pillButtonTextActive
                        : [sharedStyles.pillButtonText, { color: buttonTextColor }]
                    }
                  >
                    All
                  </Text>
                </TouchableOpacity>

                {habitList.map((habit) => (
                  <TouchableOpacity
                    key={habit.id}
                    style={[
                      sharedStyles.pillButton,
                      filterHabitId === habit.id && sharedStyles.pillButtonActive,
                    ]}
                    onPress={() => setFilterHabitId(habit.id)}
                  >
                    <Text
                      style={
                        filterHabitId === habit.id
                          ? sharedStyles.pillButtonTextActive
                          : [sharedStyles.pillButtonText, { color: buttonTextColor }]
                      }
                    >
                      {habit.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={sharedStyles.sectionTitle}>Recent Logs</Text>
          </View>
        }
        ListEmptyComponent={<Text style={[sharedStyles.emptyText, styles.emptyText]}>No logs found</Text>}
        renderItem={({ item }) => (
          <View style={styles.itemWrapper}>
            {/* Row layout keeps details + actions close together for quick edits/deletes. */}
            {/* Reference: https://callstack.github.io/react-native-paper/docs/components/List/ListItem/ */}
            <View style={sharedStyles.card}>
              <Text style={[styles.cardTitle, { color: palette.text }]}>{item.habitName}</Text>
              <Text style={[styles.cardText, { color: palette.textMuted }]}>
                Date: {item.date}
              </Text>
              <Text style={[styles.cardText, { color: palette.textMuted }]}>
                Value: {item.value}
              </Text>
              {item.notes ? (
                <Text style={[styles.cardText, { color: palette.textMuted }]}>Notes: {item.notes}</Text>
              ) : null}

              <View style={sharedStyles.inlineActions}>
                <TouchableOpacity
                  style={[sharedStyles.secondaryButton, styles.actionButton]}
                  onPress={() => startEditingLog(item)}
                >
                  <Text style={sharedStyles.buttonTextSecondary}>Edit Log</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[sharedStyles.dangerButton, styles.actionButton]}
                  onPress={() => deleteLog(item.id)}
                >
                  <Text style={sharedStyles.buttonTextDanger}>Delete Log</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  secondaryAction: {
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  itemWrapper: {
    paddingHorizontal: spacing.xl,
  },
  logsListContent: {
    paddingBottom: spacing.xl,
  },
});