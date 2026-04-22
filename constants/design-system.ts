import { ViewStyle } from 'react-native';

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export type AppPalette = {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  danger: string;
  inputBackground: string;
  buttonTextOnPrimary: string;
  tabBarBackground: string;
};

export const getPalette = (isDark: boolean): AppPalette => ({
  background: isDark ? '#111827' : '#f3f4f6',
  surface: isDark ? '#1f2937' : '#ffffff',
  surfaceAlt: isDark ? '#374151' : '#e5e7eb',
  text: isDark ? '#f9fafb' : '#111827',
  textMuted: isDark ? '#d1d5db' : '#4b5563',
  border: isDark ? '#374151' : '#d1d5db',
  primary: '#2563eb',
  danger: '#dc2626',
  inputBackground: isDark ? '#111827' : '#ffffff',
  buttonTextOnPrimary: '#ffffff',
  tabBarBackground: isDark ? '#0f172a' : '#ffffff',
});

// Inspired by: https://reactnativecomponents.com/components/card
export const getCardShadow = (isDark: boolean): ViewStyle =>
  isDark
    ? {
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
      }
    : {
        shadowColor: '#0f172a',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      };

// Inspired by: https://reactnativecomponents.com/components/button
export const buttonHeights = {
  md: 44,
  lg: 48,
};

// Inspired by: https://reactnativecomponents.com/components/input
export const inputHeight = 46;