import { db } from './client';
import { targets } from './schema';
import { getCurrentUser } from './auth';

// Small helper keeps target insert shape in one place for screens/tests to reuse.
export async function createTarget(habitId: number, period: 'weekly' | 'monthly', targetValue: number) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return;
  }

  await db.insert(targets).values({
    userId: currentUser.id,
    habitId,
    period,
    targetValue,
    isActive: true,
    createdAt: new Date().toISOString(),
  });
}