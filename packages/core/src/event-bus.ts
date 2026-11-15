type Listener<T = unknown> = (data: T) => void;

/** Global event bus for communication between panels */
export class EventBus {
  private listeners = new Map<string, Set<Listener>>();
  private static instance: EventBus | null = null;

  static getInstance(): EventBus {
    if (!EventBus.instance) EventBus.instance = new EventBus();
    return EventBus.instance;
  }

  on<T = unknown>(event: string, listener: Listener<T>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    const set = this.listeners.get(event)!;
    set.add(listener as Listener);
    return () => set.delete(listener as Listener);
  }

  emit<T = unknown>(event: string, data: T): void {
    const set = this.listeners.get(event);
    if (set) set.forEach((fn) => fn(data));
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const bus = EventBus.getInstance();
