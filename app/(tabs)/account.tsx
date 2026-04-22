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
  // State stores the currently logged in user details
  // The screen reloads when opened so the latest session is shown
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);
  const { theme, toggleTheme, isDark } = useAppTheme();
  const palette = getPalette(isDark);
  const sharedStyles = createSharedStyles(palette, isDark);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
  );

  const loadUser = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    await logoutUser();
    router.replace('/login' as any);
  };

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

      {/* Inspired by: https://reactnativecomponents.com/components/card */}
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

      {/* Inspired by: https://reactnativecomponents.com/components/button */}
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