import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

const sqlite = openDatabaseSync('habits.db');

// Create tables on startup so local SQLite is ready before any screen hits the DB.
// Reference: https://docs.expo.dev/versions/latest/sdk/sqlite/
sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL
  );
`);

sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    type TEXT NOT NULL
  );
`);

sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS habit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    value INTEGER NOT NULL,
    notes TEXT
  );
`);

sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    period TEXT NOT NULL,
    target_value INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );
`);

sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );
`);

sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    is_logged_in INTEGER NOT NULL DEFAULT 1
  );
`);

sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL
  );
`);

export const db = drizzle(sqlite);