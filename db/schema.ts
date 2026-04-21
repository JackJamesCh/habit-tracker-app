import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Categories table stores the different habit categories
// Each habit will belong to one category
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  color: text('color').notNull(),
});

// Habits table stores the main habits created by the user
// categoryId links each habit to a category
export const habits = sqliteTable('habits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  categoryId: integer('category_id').notNull(),
  type: text('type').notNull(), // completed or count-based
});

// Habit logs table stores each habit activity record
// This is the main record table required by your project
export const habitLogs = sqliteTable('habit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  habitId: integer('habit_id').notNull(),
  date: text('date').notNull(),
  value: integer('value').notNull(),
  notes: text('notes'),
});

// Targets table stores weekly or monthly goals for habits
// This will be useful later for progress tracking
export const targets = sqliteTable('targets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  habitId: integer('habit_id').notNull(),
  period: text('period').notNull(), // weekly or monthly
  targetValue: integer('target_value').notNull(),
  isActive: integer('is_active', { mode: 'boolean' })
    .notNull()
    .default(true),
  createdAt: text('created_at').notNull(),
});