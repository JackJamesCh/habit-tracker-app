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

// Users table stores account details for people using the app
// This is used for sign up and login
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
});

// Sessions table stores the currently logged in user
// This lets the app remember login state after restart
export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  isLoggedIn: integer('is_logged_in', { mode: 'boolean' })
    .notNull()
    .default(true),
});

// Settings table stores simple app preferences like theme mode
// This allows dark mode to stay saved after the app restarts
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
});