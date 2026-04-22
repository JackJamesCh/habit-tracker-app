import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSavedTheme, saveTheme } from '../db/settings';

type ThemeMode = 'light' | 'dark';

type ThemeContextType = {
  theme: ThemeMode;
  toggleTheme: () => Promise<void>;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Theme state is shared across the app and loaded from SQLite
  // This keeps the user preference saved after restarting the app
  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await getSavedTheme();
      setTheme(savedTheme as ThemeMode);
    };

    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme: ThemeMode = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    await saveTheme(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        isDark: theme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used inside ThemeProvider');
  }

  return context;
}