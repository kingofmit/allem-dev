/**
 * Reactive value holder compatible with useSyncExternalStore.
 * Used for values that update frequently (FPS, memory, vitals)
 * but aren't managed by a full Store class.
 */
export class SimpleStore<T> {
  private value: T;
  private listeners = new Set<() => void>();

  constructor(initial: T) {
    this.value = initial;
  }

  get = (): T => this.value;

  set = (v: T): void => {
    this.value = v;
    this.listeners.forEach((fn) => fn());
  };

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
}
