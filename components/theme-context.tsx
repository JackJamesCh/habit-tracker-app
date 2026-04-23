import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';

type ThemeContextType = {
  theme: ThemeMode;
  toggleTheme: () => Promise<void>;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Theme lives in context so every screen can read the same value without prop passing.
  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    // Load saved theme once on mount so app opens with the user's last preference.
    // Reference: https://react.dev/reference/react/useEffect
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

  // Toggle updates UI immediately then tries to persist so app still feels responsive.
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
    // Safe fallback avoids crashing tests/screens that render outside provider.
    return {
      theme: 'light' as const,
      toggleTheme: async () => {},
      isDark: false,
    };
  }

  return context;
}