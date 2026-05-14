import { StorageKeys, buildStorage } from '../src/utils/storage';

describe('Storage', () => {
  it('buildStorage wraps AsyncStorage with a typed key', () => {
    const store = buildStorage<{ name: string }>(StorageKeys.PROFILE);
    expect(store.key).toBe('@ef/profile');
  });

  it('get returns null when nothing stored', async () => {
    const store = buildStorage<{ name: string }>(StorageKeys.PROFILE);
    const val = await store.get();
    expect(val).toBeNull();
  });

  it('save and get round-trip', async () => {
    const store = buildStorage<{ name: string }>(StorageKeys.PROFILE);
    await store.save({ name: 'test' });
    const val = await store.get();
    expect(val).toEqual({ name: 'test' });
  });
});
