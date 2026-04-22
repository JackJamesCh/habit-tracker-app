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
  // State stores sign up values and simple validation feedback
  // After sign up, the user is logged in automatically and sent into the app
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { isDark } = useAppTheme();
  const palette = getPalette(isDark);
  const sharedStyles = createSharedStyles(palette, isDark);

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

        {/* Inspired by: https://reactnativecomponents.com/components/card */}
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

          {/* Inspired by: https://reactnativecomponents.com/components/button */}
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
  // Inspired by: https://reactnativecomponents.com/components/button
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