import { eq } from 'drizzle-orm';
import { db } from './client';
import { settings } from './schema';

// Theme is stored locally so preference survives app restarts without a backend.
export async function getSavedTheme() {
  const result = await db.select().from(settings).where(eq(settings.key, 'theme'));

  if (result.length === 0) {
    return 'light';
  }

  return result[0].value;
}

// Upsert style logic keeps one "theme" row instead of creating duplicates over time.
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