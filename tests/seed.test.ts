import { seedDatabase } from '../db/seed';
import { db } from '../db/client';
import { categories } from '../db/schema';

jest.mock('../db/client', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}));

const mockDb = db as unknown as { select: jest.Mock; insert: jest.Mock };

describe('seedDatabase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserts seed data when tables are empty', async () => {
    const mockFrom = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 1, name: 'Fitness', color: '#3b82f6' },
        { id: 2, name: 'Learning', color: '#8b5cf6' },
        { id: 3, name: 'Health', color: '#10b981' },
      ]);

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
    const mockFrom = jest.fn().mockResolvedValue([
      { id: 1, name: 'Existing', color: '#111111' },
    ]);

    mockDb.select.mockReturnValue({ from: mockFrom });

    await seedDatabase();

    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});
