import { Stack, router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { seedDatabase } from '../db/seed';
import { getCurrentUser } from '../db/auth';

export default function RootLayout() {
  // This checks whether a user is logged in when the app starts
  // It then sends the user either to login or into the main app
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const prepareApp = async () => {
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

  if (isCheckingAuth) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}