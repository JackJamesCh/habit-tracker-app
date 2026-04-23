import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { deleteCurrentUser, getCurrentUser, logoutUser } from '../../db/auth';
import { useAppTheme } from '../../components/theme-context';
import { getPalette, spacing } from '../../constants/design-system';
import { createSharedStyles } from '../../components/ui/shared-styles';

type CurrentUser = {
  id: number;
  username: string;
  email: string;
  password: string;
} | null;

export default function AccountScreen() {
  // Keep current user info in state so account actions can render immediately after reloads.
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);

  // Theme values are shared from context so this screen matches the rest of the app.
  const { theme, toggleTheme, isDark } = useAppTheme();
  const palette = getPalette(isDark);
  const sharedStyles = createSharedStyles(palette, isDark);

  // Recheck session on focus so account details stay up to date after auth changes.
  // Reference: https://reactnavigation.org/docs/use-focus-effect
  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
  );

  // Pulling this from the DB keeps the screen tied to the active local session.
  const loadUser = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
  };

  // Logout only clears session and returns to login; user data stays in DB.
  const handleLogout = async () => {
    await logoutUser();
    router.replace('/login' as any);
  };

  // Delete action is wrapped in confirm dialog to prevent accidental account removal.
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCurrentUser();
            router.replace('/login' as any);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.screenContent}>
      <Text style={sharedStyles.title}>Account</Text>

      {/* Main profile details are separated from actions so layout is easier to scan. */}
      {/* Styling idea inspired by: https://reactnativeelements.com/docs/components/card */}
      {currentUser ? (
        <View style={sharedStyles.card}>
          <Text style={[styles.label, { color: palette.textMuted }]}>Username</Text>
          <Text style={[styles.value, { color: palette.text }]}>{currentUser.username}</Text>

          <Text style={[styles.label, { color: palette.textMuted }]}>Email</Text>
          <Text style={[styles.value, { color: palette.text }]}>{currentUser.email}</Text>
        </View>
      ) : (
        <Text style={sharedStyles.emptyText}>No user is currently logged in.</Text>
      )}

      {/* Account actions are grouped together since users usually do these from one place. */}
      {/* Reference: https://callstack.github.io/react-native-paper/docs/components/Button/ */}
      <View style={sharedStyles.card}>
        <TouchableOpacity style={sharedStyles.secondaryButton} onPress={toggleTheme}>
          <Text style={sharedStyles.buttonTextSecondary}>
            Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[sharedStyles.primaryButton, styles.buttonSpacing]} onPress={handleLogout}>
          <Text style={sharedStyles.buttonTextPrimary}>Log Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[sharedStyles.dangerButton, styles.buttonSpacing]} onPress={handleDeleteAccount}>
          <Text style={sharedStyles.buttonTextDanger}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    marginBottom: 4,
    marginTop: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
  },
  buttonSpacing: {
    marginTop: spacing.sm,
  },
});