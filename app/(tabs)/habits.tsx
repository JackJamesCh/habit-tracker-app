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
  // State stores form input and data loaded from SQLite
  // The app now reads and writes habits from the real database
  const [habitName, setHabitName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [habitType, setHabitType] = useState<'completed' | 'count-based'>('completed');
  const [habitList, setHabitList] = useState<HabitItem[]>([]);
  const [categoryList, setCategoryList] = useState<CategoryItem[]>([]);
  const { isDark } = useAppTheme();

  const backgroundColor = isDark ? '#111827' : '#f5f5f5';
  const cardColor = isDark ? '#1f2937' : '#ffffff';
  const textColor = isDark ? '#f9fafb' : '#000000';
  const subTextColor = isDark ? '#d1d5db' : '#444444';
  const inputColor = isDark ? '#1f2937' : '#ffffff';
  const borderColor = isDark ? '#374151' : '#bbb';
  const buttonTextColor = isDark ? '#f9fafb' : '#000000';
  const unselectedButtonColor = isDark ? '#374151' : '#ddd';

  // Loads categories and habits when the screen opens
  // This keeps the UI in sync with the data saved in SQLite
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

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

  // Inserts a new habit into the database and reloads the list
  // It stops empty names or missing categories from being saved
  const addHabit = async () => {
    if (!habitName.trim() || selectedCategoryId === null) return;

    await db.insert(habits).values({
      name: habitName.trim(),
      categoryId: selectedCategoryId,
      type: habitType,
    });

    setHabitName('');
    setHabitType('completed');
    await loadData();
  };

  // Deletes one habit from the database using its id
  // After delete, the screen reloads the updated habit list
  const deleteHabit = async (habitId: number) => {
    await db.delete(habits).where(eq(habits.id, habitId));
    await loadData();
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>Habit Tracker</Text>

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: inputColor,
            borderColor,
            color: textColor,
          },
        ]}
        placeholder="Enter habit name"
        placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
        value={habitName}
        onChangeText={setHabitName}
      />

      <Text style={[styles.label, { color: textColor }]}>Category</Text>
      <View style={styles.row}>
        {categoryList.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.optionButton,
              { backgroundColor: unselectedButtonColor },
              selectedCategoryId === category.id && styles.selectedButton,
            ]}
            onPress={() => setSelectedCategoryId(category.id)}
          >
            <Text
              style={
                selectedCategoryId === category.id
                  ? styles.selectedText
                  : [styles.optionText, { color: buttonTextColor }]
              }
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: textColor }]}>Type</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            { backgroundColor: unselectedButtonColor },
            habitType === 'completed' && styles.selectedButton,
          ]}
          onPress={() => setHabitType('completed')}
        >
          <Text
            style={
              habitType === 'completed'
                ? styles.selectedText
                : [styles.optionText, { color: buttonTextColor }]
            }
          >
            Completed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionButton,
            { backgroundColor: unselectedButtonColor },
            habitType === 'count-based' && styles.selectedButton,
          ]}
          onPress={() => setHabitType('count-based')}
        >
          <Text
            style={
              habitType === 'count-based'
                ? styles.selectedText
                : [styles.optionText, { color: buttonTextColor }]
            }
          >
            Count-based
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={addHabit}>
        <Text style={styles.addButtonText}>Add Habit</Text>
      </TouchableOpacity>

      <Text style={[styles.listTitle, { color: textColor }]}>Your Habits</Text>

      <FlatList
        data={habitList}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: subTextColor }]}>No habits yet</Text>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              {
                backgroundColor: cardColor,
                borderLeftWidth: 8,
                borderLeftColor: item.categoryColor,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View
                style={[styles.categoryDot, { backgroundColor: item.categoryColor }]}
              />
              <Text style={[styles.cardTitle, { color: textColor }]}>{item.name}</Text>
            </View>

            <Text style={[styles.cardText, { color: subTextColor }]}>
              Category: {item.categoryName}
            </Text>
            <Text style={[styles.cardText, { color: subTextColor }]}>
              Type: {item.type}
            </Text>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteHabit(item.id)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

// Basic screen styling for layout and spacing
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
  input: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
  },
  label: {
    fontWeight: '600',
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 8,
  },
  selectedButton: {
    backgroundColor: '#2563eb',
  },
  optionText: {},
  selectedText: {
    color: '#fff',
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
});