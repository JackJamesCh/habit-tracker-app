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
import { loginUser, registerUser } from '../db/auth';
import { useAppTheme } from '../components/theme-context';
import { getPalette, radius, spacing } from '../constants/design-system';
import { createSharedStyles } from '../components/ui/shared-styles';

export default function SignupScreen() {
  // Keep the signup form state local so validation and reset behavior stay straightforward.
  // Reference: https://react.dev/reference/react/useState
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Pulling colors from the theme context keeps dark mode behavior consistent everywhere.
  const { isDark } = useAppTheme();
  const palette = getPalette(isDark);
  const sharedStyles = createSharedStyles(palette, isDark);

  // Signup reuses the same auth flow as login, then navigates into tabs right away.
  const handleSignup = async () => {
    try {
      setErrorMessage('');

      if (!username.trim() || !email.trim() || !password.trim()) {
        setErrorMessage('Please fill in all fields');
        return;
      }

      await registerUser(username.trim(), email.trim(), password.trim());
      await loginUser(email.trim(), password.trim());

      router.replace('/habits' as any);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Sign up failed');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={sharedStyles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[sharedStyles.screenContent, styles.centeredContent]}>
        <Text style={sharedStyles.title}>Sign Up</Text>
        <Text style={sharedStyles.subtitle}>Create an account to use your habit tracker</Text>

        {/* Keeping inputs in one card gives the screen a cleaner flow on mobile. */}
        {/* Styling idea inspired by: https://reactnativeelements.com/docs/components/card */}
        <View style={sharedStyles.card}>
          <TextInput
            style={sharedStyles.input}
            placeholder="Username"
            placeholderTextColor={palette.textMuted}
            value={username}
            onChangeText={setUsername}
          />

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

          {/* Main CTA is separated from the link so the primary action stays clear. */}
          {/* Reference: https://callstack.github.io/react-native-paper/docs/components/Button/ */}
          <TouchableOpacity style={sharedStyles.primaryButton} onPress={handleSignup}>
            <Text style={sharedStyles.buttonTextPrimary}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/login' as any)}>
            <Text style={[styles.link, { color: palette.primary }]}>Already have an account? Login</Text>
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