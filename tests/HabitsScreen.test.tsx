import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import HabitsScreen from '../app/(tabs)/habits';
import { db } from '../db/client';
import { categories, habits } from '../db/schema';

jest.mock('../db/client', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  },
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

describe('HabitsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserts a habit and shows it in the list after pressing Add Habit', async () => {
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

    const fromCategoriesFirstLoad = jest.fn().mockResolvedValue(initialCategories);
    const fromHabitsFirstLoad = jest.fn().mockResolvedValue(initialHabits);
    const fromCategoriesSecondLoad = jest.fn().mockResolvedValue(initialCategories);
    const fromHabitsSecondLoad = jest.fn().mockResolvedValue(updatedHabits);

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
