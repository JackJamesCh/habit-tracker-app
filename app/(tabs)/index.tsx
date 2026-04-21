import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Simple type to represent one habit in the app
type Habit = {
  id: string;
  name: string;
  category: string;
  type: 'completed' | 'count-based';
};

export default function HabitsScreen() {
  // State is used for the form inputs and the habit list
  // Later on, this data will come from SQLite instead of useState
  const [habitName, setHabitName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Fitness');
  const [habitType, setHabitType] = useState<'completed' | 'count-based'>('completed');
  const [habits, setHabits] = useState<Habit[]>([]);

  // Hardcoded categories for now
  const categories = ['Fitness', 'Learning', 'Health'];

  // Adds a new habit to the top of the list
  // It stops empty habit names from being added
  const addHabit = () => {
    if (!habitName.trim()) return;

    const newHabit: Habit = {
      id: Date.now().toString(),
      name: habitName.trim(),
      category: selectedCategory,
      type: habitType,
    };

    setHabits((prevHabits) => [newHabit, ...prevHabits]);
    setHabitName('');
    setSelectedCategory('Fitness');
    setHabitType('completed');
  };

  // Removes a habit by filtering it out of the array
  // This is a simple way to handle delete before using a database
  const deleteHabit = (habitId: string) => {
    setHabits((prevHabits) => prevHabits.filter((habit) => habit.id !== habitId));
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
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.optionButton,
              selectedCategory === category && styles.selectedButton,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={
                selectedCategory === category ? styles.selectedText : styles.optionText
              }
            >
              {category}
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
            style={habitType === 'count-based' ? styles.selectedText : styles.optionText}
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
        data={habits}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No habits yet</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardText}>Category: {item.category}</Text>
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

// Basic styles for the main layout and cards
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