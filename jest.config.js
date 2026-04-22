module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|react-native|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|@expo/vector-icons|@react-navigation/.*|expo-router|unimodules|sentry-expo|native-base|react-native-svg))',
  ],
};
