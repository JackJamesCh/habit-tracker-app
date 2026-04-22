import React, { createContext, useContext, useEffect, useState } from 'react';

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
      try {
        const { getSavedTheme } = await import('../db/settings');
        const savedTheme = await getSavedTheme();
        setTheme(savedTheme as ThemeMode);
      } catch {
        setTheme('light');
      }
    };

    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme: ThemeMode = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    try {
      const { saveTheme } = await import('../db/settings');
      await saveTheme(newTheme);
    } catch {
      // Ignore persistence errors so UI theme still toggles in unsupported environments.
    }
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
    return {
      theme: 'light' as const,
      toggleTheme: async () => {},
      isDark: false,
    };
  }

  return context;
}