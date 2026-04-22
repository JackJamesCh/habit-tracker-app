import React, { useEffect, useState } from 'react';
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

// This type is used for the habits shown on screen
type HabitItem = {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
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

  // Loads categories and habits when the screen opens
  // This keeps the UI in sync with the data saved in SQLite
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const savedCategories = await db.select().from(categories);
    const savedHabits = await db.select().from(habits);

    setCategoryList(savedCategories);

    // Set the first category as default once categories are loaded
    if (savedCategories.length > 0 && selectedCategoryId === null) {
      setSelectedCategoryId(savedCategories[0].id);
    }

    const habitsWithCategoryNames: HabitItem[] = savedHabits.map((habit) => {
      const matchedCategory = savedCategories.find(
        (category) => category.id === habit.categoryId
      );

      return {
        id: habit.id,
        name: habit.name,
        categoryId: habit.categoryId,
        categoryName: matchedCategory ? matchedCategory.name : 'Unknown',
        type: habit.type as 'completed' | 'count-based',
      };
    });

    setHabitList(habitsWithCategoryNames);
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
    <View style={styles.container}>
      <Text style={styles.title}>Habit Tracker</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter habit name"
        value={habitName}
        onChangeText={setHabitName}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.row}>
        {categoryList.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.optionButton,
              selectedCategoryId === category.id && styles.selectedButton,
            ]}
            onPress={() => setSelectedCategoryId(category.id)}
          >
            <Text
              style={
                selectedCategoryId === category.id
                  ? styles.selectedText
                  : styles.optionText
              }
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Type</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            habitType === 'completed' && styles.selectedButton,
          ]}
          onPress={() => setHabitType('completed')}
        >
          <Text
            style={habitType === 'completed' ? styles.selectedText : styles.optionText}
          >
            Completed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionButton,
            habitType === 'count-based' && styles.selectedButton,
          ]}
          onPress={() => setHabitType('count-based')}
        >
          <Text
            style={
              habitType === 'count-based' ? styles.selectedText : styles.optionText
            }
          >
            Count-based
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={addHabit}>
        <Text style={styles.addButtonText}>Add Habit</Text>
      </TouchableOpacity>

      <Text style={styles.listTitle}>Your Habits</Text>

      <FlatList
        data={habitList}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={styles.emptyText}>No habits yet</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardText}>Category: {item.categoryName}</Text>
            <Text style={styles.cardText}>Type: {item.type}</Text>

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
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#bbb',
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
    backgroundColor: '#ddd',
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 8,
  },
  selectedButton: {
    backgroundColor: '#2563eb',
  },
  optionText: {
    color: '#000',
  },
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
    color: '#444',
  },
  card: {
    backgroundColor: '#fff',
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