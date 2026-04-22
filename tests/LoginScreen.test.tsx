import React from 'react';
import { render } from '@testing-library/react-native';
import LoginScreen from '../app/login';

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
    const { getAllByText, getByPlaceholderText } = render(React.createElement(LoginScreen));

    expect(getAllByText('Login')).toHaveLength(2);
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getAllByText('Login')[1]).toBeTruthy();
  });
});
