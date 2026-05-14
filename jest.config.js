module.exports = {
  preset: 'react-native',
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-async-storage/async-storage)/)',
  ],
};
