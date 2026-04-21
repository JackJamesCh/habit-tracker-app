import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { seedDatabase } from '../db/seed';

export default function RootLayout() {
  // Seed sample data once when the app starts
  // This gives the app some starting categories and habits to work with
  useEffect(() => {
    seedDatabase();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}