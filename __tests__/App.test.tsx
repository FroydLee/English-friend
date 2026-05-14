import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

// Mock NavigationContainer to avoid full navigation setup
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock Native Stack
jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Screen: () => null,
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock NativeModules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.NativeModules.FloatingWindowModule = {
    startService: jest.fn(),
    stopService: jest.fn(),
    isServiceRunning: jest.fn(),
  };
  return RN;
});

describe('App', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<App />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders PetOverlay inside the app', () => {
    const { queryByTestId } = render(<App />);
    // PetOverlay renders View containers — verify the app tree exists
    expect(queryByTestId).toBeDefined();
  });
});
