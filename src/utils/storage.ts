import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_SETTINGS: 'mindflow_user_settings',
  SESSION_HISTORY: 'mindflow_session_history',
  ACHIEVEMENTS: 'mindflow_achievements',
  USER_STATS: 'mindflow_user_stats',
  DAILY_STATS: 'mindflow_daily_stats',
  APP_PREFERENCES: 'mindflow_app_preferences',
  LAST_SESSION_DATE: 'mindflow_last_session_date',
  NOTIFICATIONS_SETTINGS: 'mindflow_notifications_settings',
  THEME_PREFERENCE: 'mindflow_theme_preference',
  ONBOARDING_COMPLETED: 'mindflow_onboarding_completed',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

interface StorageOptions {
  encrypt?: boolean;
  ttl?: number;
}

interface StorageValue<T> {
  data: T;
  timestamp: number;
  ttl?: number;
}

class StorageManager {
  async setItem<T>(
    key: StorageKey,
    value: T,
    options?: StorageOptions
  ): Promise<void> {
    try {
      const storageValue: StorageValue<T> = {
        data: value,
        timestamp: Date.now(),
        ttl: options?.ttl,
      };
      await AsyncStorage.setItem(key, JSON.stringify(storageValue));
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
      throw error;
    }
  }

  async getItem<T>(key: StorageKey): Promise<T | null> {
    try {
      const item = await AsyncStorage.getItem(key);
      if (!item) {
        return null;
      }

      const storageValue: StorageValue<T> = JSON.parse(item);

      // Check if TTL has expired
      if (storageValue.ttl) {
        const age = Date.now() - storageValue.timestamp;
        if (age > storageValue.ttl) {
          await this.removeItem(key);
          return null;
        }
      }

      return storageValue.data;
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  }

  async removeItem(key: StorageKey): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      throw error;
    }
  }

  async removeMultiple(keys: StorageKey[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error removing multiple items:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  async getMultiple<T extends Record<string, any>>(
    keys: StorageKey[]
  ): Promise<Partial<T>> {
    try {
      const items = await AsyncStorage.multiGet(keys);
      const result: Partial<T> = {};

      for (const [key, value] of items) {
        if (value) {
          try {
            const storageValue: StorageValue<any> = JSON.parse(value);

            // Check TTL
            if (storageValue.ttl) {
              const age = Date.now() - storageValue.timestamp;
              if (age > storageValue.ttl) {
                await this.removeItem(key as StorageKey);
                continue;
              }
            }

            result[key as keyof T] = storageValue.data;
          } catch {
            // Skip invalid JSON
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Error getting multiple items:', error);
      return {};
    }
  }

  async setMultiple<T extends Record<string, any>>(
    items: T,
    options?: StorageOptions
  ): Promise<void> {
    try {
      const entries = Object.entries(items).map(([key, value]) => {
        const storageValue: StorageValue<any> = {
          data: value,
          timestamp: Date.now(),
          ttl: options?.ttl,
        };
        return [key, JSON.stringify(storageValue)];
      });

      await AsyncStorage.multiSet(entries as [string, string][]);
    } catch (error) {
      console.error('Error setting multiple items:', error);
      throw error;
    }
  }

  async incrementValue(key: StorageKey, increment: number = 1): Promise<number> {
    try {
      const current = await this.getItem<number>(key);
      const newValue = (current || 0) + increment;
      await this.setItem(key, newValue);
      return newValue;
    } catch (error) {
      console.error(`Error incrementing value ${key}:`, error);
      throw error;
    }
  }

  async appendToArray<T>(key: StorageKey, item: T): Promise<T[]> {
    try {
      const current = await this.getItem<T[]>(key);
      const newArray = [...(current || []), item];
      await this.setItem(key, newArray);
      return newArray;
    } catch (error) {
      console.error(`Error appending to array ${key}:`, error);
      throw error;
    }
  }

  async removeFromArray<T>(
    key: StorageKey,
    predicate: (item: T) => boolean
  ): Promise<T[]> {
    try {
      const current = await this.getItem<T[]>(key);
      if (!current) {
        return [];
      }
      const newArray = current.filter((item) => !predicate(item));
      await this.setItem(key, newArray);
      return newArray;
    } catch (error) {
      console.error(`Error removing from array ${key}:`, error);
      throw error;
    }
  }

  async updateObject<T extends Record<string, any>>(
    key: StorageKey,
    updates: Partial<T>
  ): Promise<T | null> {
    try {
      const current = await this.getItem<T>(key);
      if (!current) {
        return null;
      }
      const updated = { ...current, ...updates };
      await this.setItem(key, updated);
      return updated;
    } catch (error) {
      console.error(`Error updating object ${key}:`, error);
      throw error;
    }
  }

  async hasKey(key: StorageKey): Promise<boolean> {
    try {
      const item = await AsyncStorage.getItem(key);
      return item !== null;
    } catch (error) {
      console.error(`Error checking key ${key}:`, error);
      return false;
    }
  }

  async getSize(): Promise<number> {
    try {
      const keys = await this.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      let size = 0;

      for (const [, value] of items) {
        if (value) {
          size += value.length;
        }
      }

      return size;
    } catch (error) {
      console.error('Error calculating storage size:', error);
      return 0;
    }
  }

  async clearExpired(): Promise<void> {
    try {
      const keys = await this.getAllKeys();
      const items = await AsyncStorage.multiGet(keys as string[]);

      const keysToRemove: string[] = [];

      for (const [key, value] of items) {
        if (value) {
          try {
            const storageValue: StorageValue<any> = JSON.parse(value);

            if (storageValue.ttl) {
              const age = Date.now() - storageValue.timestamp;
              if (age > storageValue.ttl) {
                keysToRemove.push(key);
              }
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }
    } catch (error) {
      console.error('Error clearing expired items:', error);
    }
  }
}

export const storage = new StorageManager();

export { STORAGE_KEYS };

export async function initializeStorage(): Promise<void> {
  try {
    // Clear expired items on initialization
    await storage.clearExpired();
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}