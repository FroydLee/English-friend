import { renderHook, act } from '@testing-library/react-native';
import { PetStatus } from '../src/types';
import { createPetStateMachine, usePetState } from '../src/hooks/usePetState';

describe('createPetStateMachine', () => {
  it('starts in SLEEPING', () => {
    const m = createPetStateMachine();
    expect(m.status).toBe(PetStatus.SLEEPING);
  });

  it('wake transitions to ACTIVE', () => {
    const m = createPetStateMachine();
    m.wake();
    expect(m.status).toBe(PetStatus.ACTIVE);
  });

  it('startConversation transitions ACTIVE→CONVERSING', () => {
    const m = createPetStateMachine(PetStatus.ACTIVE);
    m.startConversation();
    expect(m.status).toBe(PetStatus.CONVERSING);
  });

  it('endConversation transitions to SLEEPING', () => {
    const m = createPetStateMachine(PetStatus.CONVERSING);
    m.endConversation();
    expect(m.status).toBe(PetStatus.SLEEPING);
  });

  it('timeout from ACTIVE goes to SLEEPING', () => {
    const m = createPetStateMachine(PetStatus.ACTIVE);
    m.timeout();
    expect(m.status).toBe(PetStatus.SLEEPING);
  });

  it('startConversation from SLEEPING does not transition', () => {
    const m = createPetStateMachine(PetStatus.SLEEPING);
    m.startConversation();
    expect(m.status).toBe(PetStatus.SLEEPING);
  });

  it('wake from CONVERSING does not transition', () => {
    const m = createPetStateMachine(PetStatus.CONVERSING);
    m.wake();
    expect(m.status).toBe(PetStatus.CONVERSING);
  });
});

describe('usePetState', () => {
  it('starts in SLEEPING', () => {
    const { result } = renderHook(() => usePetState());
    expect(result.current.status).toBe(PetStatus.SLEEPING);
  });

  it('wake sets ACTIVE', () => {
    const { result } = renderHook(() => usePetState());
    act(() => result.current.wake());
    expect(result.current.status).toBe(PetStatus.ACTIVE);
  });

  it('startConversation transitions ACTIVE→CONVERSING', () => {
    const { result } = renderHook(() => usePetState(PetStatus.ACTIVE));
    act(() => result.current.startConversation());
    expect(result.current.status).toBe(PetStatus.CONVERSING);
  });

  it('endConversation resets to SLEEPING', () => {
    const { result } = renderHook(() => usePetState(PetStatus.CONVERSING));
    act(() => result.current.endConversation());
    expect(result.current.status).toBe(PetStatus.SLEEPING);
  });

  it('timeout from ACTIVE goes to SLEEPING', () => {
    const { result } = renderHook(() => usePetState(PetStatus.ACTIVE));
    act(() => result.current.timeout());
    expect(result.current.status).toBe(PetStatus.SLEEPING);
  });
});
