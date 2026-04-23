import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Categories are separate so habits can share labels/colors without repeating data.
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  name: text('name').notNull(),
  color: text('color').notNull(),
});

// Habits hold the core setup for tracking then logs/targets reference these rows.
export const habits = sqliteTable('habits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  name: text('name').notNull(),
  categoryId: integer('category_id').notNull(),
  type: text('type').notNull(), // completed or count-based
});

// Logs store day to day entries. This is the table used most for progress history.
export const habitLogs = sqliteTable('habit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  habitId: integer('habit_id').notNull(),
  date: text('date').notNull(),
  value: integer('value').notNull(),
  notes: text('notes'),
});

// Targets store goal rules separately so progress can be recalculated from logs anytime.
export const targets = sqliteTable('targets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  habitId: integer('habit_id').notNull(),
  period: text('period').notNull(), // weekly or monthly
  targetValue: integer('target_value').notNull(),
  isActive: integer('is_active', { mode: 'boolean' })
    .notNull()
    .default(true),
  createdAt: text('created_at').notNull(),
});

// Users table supports local auth for this project without an external backend.
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
});

// Session row keeps login state simple which makes route guarding easier in Expo Router.
export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  isLoggedIn: integer('is_logged_in', { mode: 'boolean' })
    .notNull()
    .default(true),
});

// Settings stores small app prefs (like theme) so UI choices persist across restarts.
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
});