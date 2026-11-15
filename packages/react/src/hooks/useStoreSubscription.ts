import { useSyncExternalStore } from "react";

/**
 * Thin wrapper around useSyncExternalStore providing a consistent
 * subscription pattern for all reactive stores in the dev panel.
 */
export function useStoreSubscription<T>(
  subscribe: (cb: () => void) => () => void,
  getSnapshot: () => T,
): T {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
