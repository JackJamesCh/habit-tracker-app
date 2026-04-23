import { db } from './client';
import { eq } from 'drizzle-orm';
import { categories, habits } from './schema';
import { getCurrentUser } from './auth';

// Seed gives first time users sample rows so tabs are not empty on first launch.
export async function seedDatabase() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return;
  }

  const existingCategoriesForUser = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, currentUser.id));

  if (existingCategoriesForUser.length > 0) {
    return;
  }

  await db.insert(categories).values([
    { userId: currentUser.id, name: 'Fitness', color: '#3b82f6' },
    { userId: currentUser.id, name: 'Learning', color: '#8b5cf6' },
    { userId: currentUser.id, name: 'Health', color: '#10b981' },
  ]);

  const savedCategoriesForUser = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, currentUser.id));

  const fitnessCategory = savedCategoriesForUser.find(
    (category) => category.name === 'Fitness'
  );
  const learningCategory = savedCategoriesForUser.find(
    (category) => category.name === 'Learning'
  );
  const healthCategory = savedCategoriesForUser.find(
    (category) => category.name === 'Health'
  );

  // Guard here avoids inserting habits with missing category ids.
  if (!fitnessCategory || !learningCategory || !healthCategory) {
    return;
  }

  await db.insert(habits).values([
    {
      name: 'Morning Run',
      userId: currentUser.id,
      categoryId: fitnessCategory.id,
      type: 'completed',
    },
    {
      name: 'Read 10 Pages',
      userId: currentUser.id,
      categoryId: learningCategory.id,
      type: 'count-based',
    },
    {
      name: 'Drink Water',
      userId: currentUser.id,
      categoryId: healthCategory.id,
      type: 'count-based',
    },
  ]);
}