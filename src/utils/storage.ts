import AsyncStorage from '@react-native-async-storage/async-storage';

export enum StorageKeys {
  SETTINGS = '@ef/settings',
  CONVERSATIONS = '@ef/conversations',
  PROFILE = '@ef/profile',
  PET_STATE = '@ef/pet_state',
}

export interface TypedStorage<T> {
  key: string;
  get(): Promise<T | null>;
  save(value: T): Promise<void>;
  clear(): Promise<void>;
}

export function buildStorage<T>(key: StorageKeys): TypedStorage<T> {
  return {
    key,
    async get(): Promise<T | null> {
      try {
        const raw = await AsyncStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch {
        return null;
      }
    },
    async save(value: T): Promise<void> {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    },
    async clear(): Promise<void> {
      await AsyncStorage.removeItem(key);
    },
  };
}
