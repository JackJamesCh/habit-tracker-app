import { db } from './client';
import { targets } from './schema';

// Small helper keeps target insert shape in one place for screens/tests to reuse.
export async function createTarget(habitId: number, period: 'weekly' | 'monthly', targetValue: number) {
  await db.insert(targets).values({
    habitId,
    period,
    targetValue,
    isActive: true,
    createdAt: new Date().toISOString(),
  });
}