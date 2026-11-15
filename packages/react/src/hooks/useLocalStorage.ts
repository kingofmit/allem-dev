import { useState, useEffect, useCallback } from "react";

/**
 * Persists a value in localStorage and keeps it synchronised across tabs
 * via the `storage` event. Gracefully handles SSR and private browsing.
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const set = useCallback(
    (v: T) => {
      setValue(v);
      try {
        localStorage.setItem(key, JSON.stringify(v));
      } catch {
        // quota exceeded or private browsing — silently ignore
      }
    },
    [key],
  );

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== key) return;
      try {
        setValue(e.newValue !== null ? (JSON.parse(e.newValue) as T) : defaultValue);
      } catch {
        setValue(defaultValue);
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [key, defaultValue]);

  return [value, set];
}
