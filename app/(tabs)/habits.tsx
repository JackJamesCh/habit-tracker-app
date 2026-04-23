import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { db } from '../../db/client';
import { categories, habits } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { useFocusEffect } from '@react-navigation/native';
import { useAppTheme } from '../../components/theme-context';
import { getPalette, spacing } from '../../constants/design-system';
import { createSharedStyles } from '../../components/ui/shared-styles';

// This type is used for the habits shown on screen
type HabitItem = {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  type: 'completed' | 'count-based';
};

// This type is used for category buttons
type CategoryItem = {
  id: number;
  name: string;
  color: string;
};

export default function HabitsScreen() {
  // Form/edit state and list data live together here so this tab stays self contained.
  const [habitName, setHabitName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [habitType, setHabitType] = useState<'completed' | 'count-based'>('completed');
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
  const [habitList, setHabitList] = useState<HabitItem[]>([]);
  const [categoryList, setCategoryList] = useState<CategoryItem[]>([]);

  // Theme is read once per render so every style picks the same palette values.
  const { isDark } = useAppTheme();
  const palette = getPalette(isDark);
  const sharedStyles = createSharedStyles(palette, isDark);

  const buttonTextColor = palette.text;

  // Reload when tab regains focus so edits made elsewhere show up immediately.
  // Reference: https://reactnavigation.org/docs/use-focus-effect
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Pull both tables here so habit rows can also show category name/color.
  const loadData = async () => {
    const savedCategories = await db.select().from(categories);
    const savedHabits = await db.select().from(habits);

    setCategoryList(savedCategories);

    // Set the first category as default once categories are loaded
    if (savedCategories.length > 0 && selectedCategoryId === null) {
      setSelectedCategoryId(savedCategories[0].id);
    }

    const habitsWithCategoryDetails: HabitItem[] = savedHabits.map((habit) => {
      const matchedCategory = savedCategories.find(
        (category) => category.id === habit.categoryId
      );

      return {
        id: habit.id,
        name: habit.name,
        categoryId: habit.categoryId,
        categoryName: matchedCategory ? matchedCategory.name : 'Unknown',
        categoryColor: matchedCategory ? matchedCategory.color : '#d1d5db',
        type: habit.type as 'completed' | 'count-based',
      };
    });

    setHabitList(habitsWithCategoryDetails);
  };

  const clearHabitForm = () => {
    setHabitName('');
    setHabitType('completed');
    setEditingHabitId(null);
  };

  // Edit mode reuses the same form as create mode to avoid a second screen.
  const saveHabit = async () => {
    if (!habitName.trim() || selectedCategoryId === null) return;

    if (editingHabitId !== null) {
      await db
        .update(habits)
        .set({
          name: habitName.trim(),
          categoryId: selectedCategoryId,
          type: habitType,
        })
        .where(eq(habits.id, editingHabitId));
    } else {
      await db.insert(habits).values({
        name: habitName.trim(),
        categoryId: selectedCategoryId,
        type: habitType,
      });
    }

    clearHabitForm();
    await loadData();
  };

  // Delete and then refresh so the list always reflects SQLite right away.
  const deleteHabit = async (habitId: number) => {
    await db.delete(habits).where(eq(habits.id, habitId));

    if (editingHabitId === habitId) {
      clearHabitForm();
    }

    await loadData();
  };

  // Prefill current values so updates feel like editing and not starting over.
  const startEditingHabit = (habit: HabitItem) => {
    setEditingHabitId(habit.id);
    setHabitName(habit.name);
    setSelectedCategoryId(habit.categoryId);
    setHabitType(habit.type);
  };

  return (
    <View style={sharedStyles.screen}>
      <FlatList
        data={habitList}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View style={sharedStyles.screenContent}>
            <Text style={sharedStyles.title}>Habit Tracker</Text>

            {/* Form controls are grouped in one card to keep create/edit flow simple. */}
            {/* Styling idea inspired by: https://reactnativeelements.com/docs/components/card */}
            <View style={sharedStyles.card}>
              <TextInput
                style={sharedStyles.input}
                placeholder="Enter habit name"
                placeholderTextColor={palette.textMuted}
                value={habitName}
                onChangeText={setHabitName}
              />

              <Text style={sharedStyles.fieldLabel}>Category</Text>
              <View style={sharedStyles.rowWrap}>
                {categoryList.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      sharedStyles.pillButton,
                      selectedCategoryId === category.id && sharedStyles.pillButtonActive,
                    ]}
                    onPress={() => setSelectedCategoryId(category.id)}
                  >
                    <Text
                      style={
                        selectedCategoryId === category.id
                          ? sharedStyles.pillButtonTextActive
                          : [sharedStyles.pillButtonText, { color: buttonTextColor }]
                      }
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={sharedStyles.fieldLabel}>Type</Text>
              <View style={sharedStyles.rowWrap}>
                <TouchableOpacity
                  style={[
                    sharedStyles.pillButton,
                    habitType === 'completed' && sharedStyles.pillButtonActive,
                  ]}
                  onPress={() => setHabitType('completed')}
                >
                  <Text
                    style={
                      habitType === 'completed'
                        ? sharedStyles.pillButtonTextActive
                        : [sharedStyles.pillButtonText, { color: buttonTextColor }]
                    }
                  >
                    Completed
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    sharedStyles.pillButton,
                    habitType === 'count-based' && sharedStyles.pillButtonActive,
                  ]}
                  onPress={() => setHabitType('count-based')}
                >
                  <Text
                    style={
                      habitType === 'count-based'
                        ? sharedStyles.pillButtonTextActive
                        : [sharedStyles.pillButtonText, { color: buttonTextColor }]
                    }
                  >
                    Count-based
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Inspired by: https://reactnative.dev/docs/touchableopacity */}
              <TouchableOpacity style={sharedStyles.primaryButton} onPress={saveHabit}>
                <Text style={sharedStyles.buttonTextPrimary}>
                  {editingHabitId !== null ? 'Update Habit' : 'Add Habit'}
                </Text>
              </TouchableOpacity>

              {editingHabitId !== null ? (
                <TouchableOpacity style={[sharedStyles.secondaryButton, styles.secondaryAction]} onPress={clearHabitForm}>
                  <Text style={sharedStyles.buttonTextSecondary}>Cancel Edit</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={sharedStyles.sectionTitle}>Your Habits</Text>
          </View>
        }
        ListEmptyComponent={<Text style={[sharedStyles.emptyText, styles.emptyPad]}>No habits yet</Text>}
        renderItem={({ item }) => (
          <View style={styles.itemWrapper}>
            <View
              style={[
                sharedStyles.card,
                styles.card,
                {
                  borderLeftWidth: 8,
                  borderLeftColor: item.categoryColor,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[styles.categoryDot, { backgroundColor: item.categoryColor }]}
                />
                <Text style={[styles.cardTitle, { color: palette.text }]}>{item.name}</Text>
              </View>

              <Text style={[styles.cardText, { color: palette.textMuted }]}>Category: {item.categoryName}</Text>
              <Text style={[styles.cardText, { color: palette.textMuted }]}>Type: {item.type}</Text>

              <View style={sharedStyles.inlineActions}>
                <TouchableOpacity
                  style={[sharedStyles.secondaryButton, styles.actionButton]}
                  onPress={() => startEditingHabit(item)}
                >
                  <Text style={sharedStyles.buttonTextSecondary}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[sharedStyles.dangerButton, styles.actionButton]}
                  onPress={() => deleteHabit(item.id)}
                >
                  <Text style={sharedStyles.buttonTextDanger}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />

    </View>
  );
}

// Basic screen styling for layout and spacing
const styles = StyleSheet.create({
  itemWrapper: {
    paddingHorizontal: spacing.xl,
  },
  card: {
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  cardText: {
    marginBottom: 2,
  },
  actionButton: {
    flex: 1,
  },
  secondaryAction: {
    marginTop: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  emptyPad: {
    marginHorizontal: spacing.xl,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
});