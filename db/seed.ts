import { db } from './client';
import { categories, habits } from './schema';

// This function adds starting sample data into the database
// It checks first so the same data is not inserted again and again
export async function seedDatabase() {
  const existingCategories = await db.select().from(categories);

  if (existingCategories.length > 0) {
    return;
  }

  await db.insert(categories).values([
    { name: 'Fitness', color: '#3b82f6' },
    { name: 'Learning', color: '#8b5cf6' },
    { name: 'Health', color: '#10b981' },
  ]);

  const savedCategories = await db.select().from(categories);

  const fitnessCategory = savedCategories.find((category) => category.name === 'Fitness');
  const learningCategory = savedCategories.find((category) => category.name === 'Learning');
  const healthCategory = savedCategories.find((category) => category.name === 'Health');

  if (!fitnessCategory || !learningCategory || !healthCategory) {
    return;
  }

  await db.insert(habits).values([
    {
      name: 'Morning Run',
      categoryId: fitnessCategory.id,
      type: 'completed',
    },
    {
      name: 'Read 10 Pages',
      categoryId: learningCategory.id,
      type: 'count-based',
    },
    {
      name: 'Drink Water',
      categoryId: healthCategory.id,
      type: 'count-based',
    },
  ]);
}