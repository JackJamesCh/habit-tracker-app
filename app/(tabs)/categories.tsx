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
import { getPalette, spacing } from '../../constants/design-system';
import { createSharedStyles } from '../../components/ui/shared-styles';

type CategoryItem = {
  id: number;
  name: string;
  color: string;
};

export default function CategoriesScreen() {
  // Keep form + list state together so adding and editing categories stays in one flow.
  const [categoryName, setCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [categoryList, setCategoryList] = useState<CategoryItem[]>([]);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  // Theme values are kept central so color previews still look right in dark mode.
  const { isDark } = useAppTheme();
  const palette = getPalette(isDark);
  const sharedStyles = createSharedStyles(palette, isDark);

  const selectedCircleBorder = palette.text;

  const colorOptions = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  // Reload when tab is focused so any DB changes are reflected right away.
  // Reference: https://reactnavigation.org/docs/use-focus-effect
  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [])
  );

  // Local DB read keeps this list fast and available offline.
  const loadCategories = async () => {
    const savedCategories = await db.select().from(categories);
    setCategoryList(savedCategories);
  };

  // Reusing one form for add/edit avoids extra navigation and keeps this screen simple.
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

  // Fill form from the selected row so users can make quick updates.
  const startEditing = (category: CategoryItem) => {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setSelectedColor(category.color);
  };

  // Reset returns the screen to add mode after save/cancel/delete.
  const resetForm = () => {
    setEditingCategoryId(null);
    setCategoryName('');
    setSelectedColor('#3b82f6');
  };

  // Delete then reload ensures stale category rows don't hang around in UI.
  const deleteCategory = async (categoryId: number) => {
    await db.delete(categories).where(eq(categories.id, categoryId));
    await loadCategories();

    if (editingCategoryId === categoryId) {
      resetForm();
    }
  };

  return (
    <View style={sharedStyles.screen}>
      <FlatList
        data={categoryList}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View style={sharedStyles.screenContent}>
            <Text style={sharedStyles.title}>Categories</Text>
            <Text style={sharedStyles.subtitle}>Create and manage habit categories</Text>

            {/* Inputs and color options are grouped so create/edit feels like one task. */}
            {/* Styling idea inspired by: https://reactnativeelements.com/docs/components/card */}
            <View style={sharedStyles.card}>
              <TextInput
                style={sharedStyles.input}
                placeholder="Category name"
                placeholderTextColor={palette.textMuted}
                value={categoryName}
                onChangeText={setCategoryName}
              />

              <Text style={sharedStyles.fieldLabel}>Choose a colour</Text>
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

              {/* Reference: https://callstack.github.io/react-native-paper/docs/components/Button/ */}
              <TouchableOpacity style={sharedStyles.primaryButton} onPress={saveCategory}>
                <Text style={sharedStyles.buttonTextPrimary}>
                  {editingCategoryId !== null ? 'Update Category' : 'Add Category'}
                </Text>
              </TouchableOpacity>

              {editingCategoryId !== null ? (
                <TouchableOpacity style={[sharedStyles.secondaryButton, styles.cancelButton]} onPress={resetForm}>
                  <Text style={sharedStyles.buttonTextSecondary}>Cancel Edit</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={sharedStyles.sectionTitle}>Saved Categories</Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={[sharedStyles.emptyText, styles.emptyText]}>No categories added yet</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.itemWrapper}>
            <View style={sharedStyles.card}>
              <View style={styles.cardTopRow}>
                <View style={[styles.colorPreview, { backgroundColor: item.color }]} />
                <Text style={[styles.cardTitle, { color: palette.text }]}>{item.name}</Text>
              </View>

              <View style={sharedStyles.inlineActions}>
                <TouchableOpacity
                  style={[sharedStyles.secondaryButton, styles.actionButton]}
                  onPress={() => startEditing(item)}
                >
                  <Text style={sharedStyles.buttonTextSecondary}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[sharedStyles.dangerButton, styles.actionButton]}
                  onPress={() => deleteCategory(item.id)}
                >
                  <Text style={sharedStyles.buttonTextDanger}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  cancelButton: {
    marginTop: spacing.sm,
  },
  emptyText: {
    marginHorizontal: spacing.xl,
  },
  itemWrapper: {
    paddingHorizontal: spacing.xl,
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
  actionButton: {
    flex: 1,
  },
});