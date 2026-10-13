import { Dispatch, SetStateAction, useEffect, useState } from 'react';

type Validator<T> = (value: unknown) => value is T;

export const isArrayOf = <T,>(value: unknown): value is T[] =>
  Array.isArray(value) && value.every((item) =>
    typeof item === 'object' && item !== null && 'id' in item && typeof item.id === 'string'
  );

export const usePersistentState = <T,>(
  storageKey: string,
  fallbackValue: T,
  validate: Validator<T>
): [T, Dispatch<SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => {
    try {
      const storedValue = localStorage.getItem(storageKey);
      if (storedValue === null) return fallbackValue;
      const parsedValue: unknown = JSON.parse(storedValue);
      return validate(parsedValue) ? parsedValue : fallbackValue;
    } catch {
      return fallbackValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Keep the in-memory CRM usable when storage is unavailable or full.
    }
  }, [storageKey, value]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      if (event.newValue === null) {
        setValue(fallbackValue);
        return;
      }

      try {
        const parsedValue: unknown = JSON.parse(event.newValue);
        if (validate(parsedValue)) setValue(parsedValue);
      } catch {
        // Ignore malformed updates from another tab.
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [fallbackValue, storageKey, validate]);

  return [value, setValue];
};
