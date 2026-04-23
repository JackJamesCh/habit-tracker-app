import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import HabitsScreen from '../app/(tabs)/habits';
import { db } from '../db/client';
import { getCurrentUser } from '../db/auth';
import { categories, habits } from '../db/schema';

// Mock DB calls so the test focuses on screen behavior, not SQLite integration details.
// Reference: https://callstack.github.io/react-native-testing-library/
jest.mock('../db/client', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../db/auth', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) => {
    const React = require('react');
    React.useEffect(() => {
      callback();
    }, [callback]);
  },
}));

jest.mock('../components/theme-context', () => ({
  useAppTheme: () => ({
    isDark: false,
    theme: 'light',
    toggleTheme: jest.fn(),
  }),
}));

const mockDb = db as unknown as {
  select: jest.Mock;
  insert: jest.Mock;
  delete: jest.Mock;
};

const mockGetCurrentUser = getCurrentUser as jest.Mock;

describe('HabitsScreen', () => {
  beforeEach(() => {
    // Reset mock history to keep each test independent.
    jest.clearAllMocks();
  });

  it('inserts a habit and shows it in the list after pressing Add Habit', async () => {
    // This proves the full add flow: load categories, submit form, insert, then refresh list.
    mockGetCurrentUser.mockResolvedValue({ id: 77, email: 'test@example.com' });

    const initialCategories = [{ id: 1, name: 'Fitness', color: '#3b82f6' }];
    const initialHabits: Array<{
      id: number;
      name: string;
      categoryId: number;
      type: 'completed' | 'count-based';
    }> = [];
    const updatedHabits = [
      {
        id: 101,
        name: 'Morning Run',
        categoryId: 1,
        type: 'completed' as const,
      },
    ];

    const whereCategoriesFirstLoad = jest.fn().mockResolvedValue(initialCategories);
    const whereHabitsFirstLoad = jest.fn().mockResolvedValue(initialHabits);
    const whereCategoriesSecondLoad = jest.fn().mockResolvedValue(initialCategories);
    const whereHabitsSecondLoad = jest.fn().mockResolvedValue(updatedHabits);

    const fromCategoriesFirstLoad = jest.fn().mockReturnValue({ where: whereCategoriesFirstLoad });
    const fromHabitsFirstLoad = jest.fn().mockReturnValue({ where: whereHabitsFirstLoad });
    const fromCategoriesSecondLoad = jest.fn().mockReturnValue({ where: whereCategoriesSecondLoad });
    const fromHabitsSecondLoad = jest.fn().mockReturnValue({ where: whereHabitsSecondLoad });

    const mockValues = jest.fn().mockResolvedValue(undefined);

    mockDb.select
      .mockReturnValueOnce({ from: fromCategoriesFirstLoad })
      .mockReturnValueOnce({ from: fromHabitsFirstLoad })
      .mockReturnValueOnce({ from: fromCategoriesSecondLoad })
      .mockReturnValueOnce({ from: fromHabitsSecondLoad });

    mockDb.insert.mockReturnValue({ values: mockValues });

    const { getByPlaceholderText, getByText, findByText } = render(
      React.createElement(HabitsScreen)
    );

    await findByText('Fitness');
    fireEvent.press(getByText('Fitness'));

    const input = getByPlaceholderText('Enter habit name');
    fireEvent.changeText(input, 'Morning Run');
    fireEvent.press(getByText('Add Habit'));

    await waitFor(() => {
      expect(mockDb.insert).toHaveBeenCalledWith(habits);
    });

    expect(mockValues).toHaveBeenCalledWith({
      userId: 77,
      name: 'Morning Run',
      categoryId: 1,
      type: 'completed',
    });

    await findByText('Morning Run');
    expect(fromCategoriesFirstLoad).toHaveBeenCalledWith(categories);
    expect(fromHabitsFirstLoad).toHaveBeenCalledWith(habits);
    expect(fromCategoriesSecondLoad).toHaveBeenCalledWith(categories);
    expect(fromHabitsSecondLoad).toHaveBeenCalledWith(habits);
  });
});
