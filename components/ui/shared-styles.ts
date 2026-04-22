import { StyleSheet } from 'react-native';
import {
  AppPalette,
  buttonHeights,
  getCardShadow,
  inputHeight,
  radius,
  spacing,
} from '../../constants/design-system';

export const createSharedStyles = (palette: AppPalette, isDark: boolean) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: palette.background,
    },
    screenContent: {
      padding: spacing.xl,
      paddingBottom: spacing.xl + spacing.sm,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: palette.text,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: 15,
      color: palette.textMuted,
      marginBottom: spacing.lg,
    },
    // Inspired by: https://reactnativecomponents.com/components/card
    card: {
      backgroundColor: palette.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: palette.border,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...getCardShadow(isDark),
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: palette.text,
      marginBottom: spacing.sm,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: palette.text,
      marginBottom: spacing.xs,
    },
    // Inspired by: https://reactnativecomponents.com/components/input
    input: {
      height: inputHeight,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.inputBackground,
      paddingHorizontal: spacing.md,
      color: palette.text,
      marginBottom: spacing.sm,
    },
    rowWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: spacing.sm,
    },
    // Inspired by: https://reactnativecomponents.com/components/button
    primaryButton: {
      height: buttonHeights.lg,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.primary,
      paddingHorizontal: spacing.lg,
    },
    secondaryButton: {
      height: buttonHeights.md,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.surfaceAlt,
      paddingHorizontal: spacing.lg,
    },
    dangerButton: {
      height: buttonHeights.md,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.danger,
      paddingHorizontal: spacing.lg,
    },
    buttonTextPrimary: {
      color: palette.buttonTextOnPrimary,
      fontWeight: '600',
      fontSize: 15,
    },
    buttonTextSecondary: {
      color: palette.text,
      fontWeight: '600',
      fontSize: 14,
    },
    buttonTextDanger: {
      color: '#ffffff',
      fontWeight: '600',
      fontSize: 14,
    },
    pillButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: palette.surfaceAlt,
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: palette.border,
    },
    pillButtonActive: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    pillButtonText: {
      color: palette.text,
      fontWeight: '500',
    },
    pillButtonTextActive: {
      color: '#ffffff',
      fontWeight: '600',
    },
    emptyText: {
      color: palette.textMuted,
      marginTop: spacing.xs,
    },
    inlineActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
  });