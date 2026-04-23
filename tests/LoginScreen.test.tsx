import React from 'react';
import { render } from '@testing-library/react-native';
import LoginScreen from '../app/login';

// Router is mocked so rendering the screen doesn't trigger real navigation.
// Reference: https://callstack.github.io/react-native-testing-library/
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

jest.mock('../db/auth', () => ({
  loginUser: jest.fn(),
}));

describe('LoginScreen', () => {
  it('renders login title, email input, password input and login button', () => {
    // Basic render test: confirms the main login controls are visible to the user.
    const { getAllByText, getByPlaceholderText } = render(React.createElement(LoginScreen));

    expect(getAllByText('Login')).toHaveLength(2);
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getAllByText('Login')[1]).toBeTruthy();
  });
});
