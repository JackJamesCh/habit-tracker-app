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
import { categories } from '../../db/schema';
import { useAppTheme } from '../../components/theme-context';

type CategoryItem = {
  id: number;
  name: string;
  color: string;
};

export default function CategoriesScreen() {
  // State stores the category form and list of saved categories
  // If a category is selected, the form switches into edit mode
  const [categoryName, setCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [categoryList, setCategoryList] = useState<CategoryItem[]>([]);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const { isDark } = useAppTheme();

  const backgroundColor = isDark ? '#111827' : '#f5f5f5';
  const cardColor = isDark ? '#1f2937' : '#ffffff';
  const textColor = isDark ? '#f9fafb' : '#000000';
  const subTextColor = isDark ? '#d1d5db' : '#555555';
  const inputColor = isDark ? '#1f2937' : '#ffffff';
  const borderColor = isDark ? '#374151' : '#bbb';
  const selectedCircleBorder = isDark ? '#f9fafb' : '#111827';

  const colorOptions = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [])
  );

  const loadCategories = async () => {
    const savedCategories = await db.select().from(categories);
    setCategoryList(savedCategories);
  };

  // Adds a new category when not editing, or updates the selected one
  // This keeps the screen simple and avoids needing a separate edit page
  const saveCategory = async () => {
    if (!categoryName.trim()) return;

    if (editingCategoryId !== null) {
      await db
        .update(categories)
        .set({
          name: categoryName.trim(),
          color: selectedColor,
        })
        .where(eq(categories.id, editingCategoryId));
    } else {
      await db.insert(categories).values({
        name: categoryName.trim(),
        color: selectedColor,
      });
    }

    resetForm();
    await loadCategories();
  };

  const startEditing = (category: CategoryItem) => {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setSelectedColor(category.color);
  };

  const resetForm = () => {
    setEditingCategoryId(null);
    setCategoryName('');
    setSelectedColor('#3b82f6');
  };

  const deleteCategory = async (categoryId: number) => {
    await db.delete(categories).where(eq(categories.id, categoryId));
    await loadCategories();

    if (editingCategoryId === categoryId) {
      resetForm();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>Categories</Text>
      <Text style={[styles.subtitle, { color: subTextColor }]}>
        Create and manage habit categories
      </Text>

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: inputColor,
            borderColor,
            color: textColor,
          },
        ]}
        placeholder="Category name"
        placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
        value={categoryName}
        onChangeText={setCategoryName}
      />

      <Text style={[styles.label, { color: textColor }]}>Choose a colour</Text>
      <View style={styles.colorRow}>
        {colorOptions.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorCircle,
              { backgroundColor: color },
              selectedColor === color && {
                borderWidth: 3,
                borderColor: selectedCircleBorder,
              },
            ]}
            onPress={() => setSelectedColor(color)}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={saveCategory}>
        <Text style={styles.saveButtonText}>
          {editingCategoryId !== null ? 'Update Category' : 'Add Category'}
        </Text>
      </TouchableOpacity>

      {editingCategoryId !== null ? (
        <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
          <Text style={styles.cancelButtonText}>Cancel Edit</Text>
        </TouchableOpacity>
      ) : null}

      <Text style={[styles.listTitle, { color: textColor }]}>Saved Categories</Text>

      <FlatList
        data={categoryList}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: subTextColor }]}>
            No categories added yet
          </Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <View style={styles.cardTopRow}>
              <View style={[styles.colorPreview, { backgroundColor: item.color }]} />
              <Text style={[styles.cardTitle, { color: textColor }]}>{item.name}</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => startEditing(item)}
              >
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteCategory(item.id)}
              >
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 20,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
    borderWidth: 1,
  },
  label: {
    fontWeight: '600',
    marginBottom: 10,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#000',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#9ca3af',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelButtonText: {
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
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorPreview: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
  },
  editButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});