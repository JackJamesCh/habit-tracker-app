import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { loginUser } from '../db/auth';
import { useAppTheme } from '../components/theme-context';
import { getPalette, radius, spacing } from '../constants/design-system';
import { createSharedStyles } from '../components/ui/shared-styles';

export default function LoginScreen() {
  // Keep these local so the form stays simple and easy to reset after each attempt.
  // Reference: https://react.dev/reference/react/useState
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Theme values are grouped here so dark/light colors are controlled in one place.
  const { isDark } = useAppTheme();
  const palette = getPalette(isDark);
  const sharedStyles = createSharedStyles(palette, isDark);

  // We validate quickly before hitting the DB call, so users get instant feedback.
  const handleLogin = async () => {
    try {
      setErrorMessage('');

      if (!email.trim() || !password.trim()) {
        setErrorMessage('Please enter email and password');
        return;
      }

      await loginUser(email.trim(), password.trim());
      router.replace('/habits' as any);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Login failed');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={sharedStyles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[sharedStyles.screenContent, styles.centeredContent]}>
        <Text style={sharedStyles.title}>Login</Text>
        <Text style={sharedStyles.subtitle}>Sign in to continue using your habit tracker</Text>

        {/* Grouping form controls in one card keeps the auth screen easier to scan. */}
        {/* Styling idea inspired by: https://reactnativeelements.com/docs/components/card */}
        <View style={sharedStyles.card}>
          <TextInput
            style={sharedStyles.input}
            placeholder="Email"
            placeholderTextColor={palette.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />

          <TextInput
            style={sharedStyles.input}
            placeholder="Password"
            placeholderTextColor={palette.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {errorMessage ? (
            <Text style={[styles.errorText, { color: palette.danger }]}>{errorMessage}</Text>
          ) : null}

          {/* Primary action is kept obvious so login is the clear next step. */}
          {/* Reference: https://callstack.github.io/react-native-paper/docs/components/Button/ */}
          <TouchableOpacity style={sharedStyles.primaryButton} onPress={handleLogin}>
            <Text style={sharedStyles.buttonTextPrimary}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/signup' as any)}>
            <Text style={[styles.link, { color: palette.primary }]}>Don&apos;t have an account? Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centeredContent: {
    justifyContent: 'center',
  },
  // Inspired by: https://reactnative.dev/docs/touchableopacity
  linkButton: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  link: {
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    marginBottom: spacing.sm,
  },
});