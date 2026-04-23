import { Stack, router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { seedDatabase } from '../db/seed';
import { getCurrentUser } from '../db/auth';
import { ThemeProvider } from '../components/theme-context';

export default function RootLayout() {
  // Keep a short loading gate while auth/session checks run so users don't see route flicker.
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // This runs on route changes so auth redirects still work after logout/login.
    // Reference: https://react.dev/reference/react/useEffect
    const prepareApp = async () => {
      // Seed only fills starter rows if tables are empty.
      await seedDatabase();

      const currentUser = await getCurrentUser();
      const inAuthScreen = pathname === '/login' || pathname === '/signup';

      if (currentUser && inAuthScreen) {
        router.replace('/habits' as any);
        return;
      }

      if (!currentUser && !inAuthScreen) {
        router.replace('/login' as any);
        return;
      }

      setIsCheckingAuth(false);
    };

    prepareApp();
  }, [pathname]);

  // Returning null here avoids flashing the wrong stack while redirects are running.
  if (isCheckingAuth) {
    return null;
  }

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}