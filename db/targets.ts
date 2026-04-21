import { db } from './client';
import { targets } from './schema';

export async function createTarget(habitId: number, period: 'weekly' | 'monthly', targetValue: number) {
  await db.insert(targets).values({
    habitId,
    period,
    targetValue,
    isActive: true,
    createdAt: new Date().toISOString(),
  });
}