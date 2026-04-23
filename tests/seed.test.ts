import { seedDatabase } from '../db/seed';
import { db } from '../db/client';
import { getCurrentUser } from '../db/auth';
import { categories } from '../db/schema';

// DB is mocked so this test checks seed behavior without touching real SQLite.
// Reference: https://jestjs.io/docs/getting-started
jest.mock('../db/client', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}));

jest.mock('../db/auth', () => ({
  getCurrentUser: jest.fn(),
}));

const mockDb = db as unknown as { select: jest.Mock; insert: jest.Mock };
const mockGetCurrentUser = getCurrentUser as jest.Mock;

describe('seedDatabase', () => {
  beforeEach(() => {
    // Clear calls between tests so each assertion only sees its own setup.
    jest.clearAllMocks();
  });

  it('inserts seed data when tables are empty', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 7, email: 'test@example.com' });

    // First read = empty categories, second read = categories after seed insert.
    const mockWhere = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 1, userId: 7, name: 'Fitness', color: '#3b82f6' },
        { id: 2, userId: 7, name: 'Learning', color: '#8b5cf6' },
        { id: 3, userId: 7, name: 'Health', color: '#10b981' },
      ]);
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });

    const mockValues = jest.fn().mockResolvedValue(undefined);

    mockDb.select.mockReturnValue({ from: mockFrom });
    mockDb.insert.mockReturnValue({ values: mockValues });

    await seedDatabase();

    expect(mockDb.select).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith(categories);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalled();
  });

  it('does not insert data when categories already exist', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 7, email: 'test@example.com' });

    // Existing categories should short circuit seed to avoid duplicate starter rows.
    const mockWhere = jest.fn().mockResolvedValue([
      { id: 1, userId: 7, name: 'Existing', color: '#111111' },
    ]);
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });

    mockDb.select.mockReturnValue({ from: mockFrom });

    await seedDatabase();

    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});
