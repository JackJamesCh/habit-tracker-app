import { eq } from 'drizzle-orm';
import { db } from './client';
import { settings } from './schema';

// Gets the saved theme from the database
// If nothing is saved yet, light mode is used by default
export async function getSavedTheme() {
  const result = await db.select().from(settings).where(eq(settings.key, 'theme'));

  if (result.length === 0) {
    return 'light';
  }

  return result[0].value;
}

// Saves the chosen theme in the database
// If a theme row already exists, it updates that row
export async function saveTheme(theme: 'light' | 'dark') {
  const existing = await db.select().from(settings).where(eq(settings.key, 'theme'));

  if (existing.length === 0) {
    await db.insert(settings).values({
      key: 'theme',
      value: theme,
    });
  } else {
    await db
      .update(settings)
      .set({ value: theme })
      .where(eq(settings.key, 'theme'));
  }
}