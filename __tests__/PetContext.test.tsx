import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { PetProvider, usePetContext } from '../src/state/PetContext';
import { PetStatus } from '../src/types';

// Helper component to test context
const TestConsumer = () => {
  const { status } = usePetContext();
  return <Text>{status}</Text>;
};

describe('PetContext', () => {
  it('provides default SLEEPING status', () => {
    const { getByText } = render(
      <PetProvider>
        <TestConsumer />
      </PetProvider>
    );
    expect(getByText(PetStatus.SLEEPING)).toBeTruthy();
  });

  it('wake transitions to ACTIVE', () => {
    const TestWake = () => {
      const { status, wake } = usePetContext();
      React.useEffect(() => { wake(); }, []);
      return <Text>{status}</Text>;
    };
    const { getByText } = render(
      <PetProvider>
        <TestWake />
      </PetProvider>
    );
    expect(getByText(PetStatus.ACTIVE)).toBeTruthy();
  });

  it('throws when used outside provider', () => {
    const TestBad = () => {
      usePetContext();
      return null;
    };
    expect(() => render(<TestBad />)).toThrow('usePetContext must be used within a PetProvider');
  });
});
