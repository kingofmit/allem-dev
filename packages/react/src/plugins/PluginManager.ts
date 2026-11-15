import React from "react";

export interface AllemDevPlugin {
  id: string;
  label: string;
  icon?: string;
  /** Render function that returns a React element for the tab content */
  render: () => React.ReactElement;
}

/**
 * Manages plugin registrations. Plugins add custom tabs to the panel.
 */
export class PluginManager {
  private plugins = new Map<string, AllemDevPlugin>();
  private listeners = new Set<() => void>();
  private snapshot: AllemDevPlugin[] = [];

  register(plugin: AllemDevPlugin): () => void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`[Allem Dev] Plugin "${plugin.id}" is already registered. Skipping.`);
      return () => {};
    }
    this.plugins.set(plugin.id, plugin);
    this.notify();
    return () => { this.unregister(plugin.id); };
  }

  unregister(id: string): void {
    this.plugins.delete(id);
    this.notify();
  }

  /** Returns a cached snapshot — safe for useSyncExternalStore */
  getAll = (): AllemDevPlugin[] => {
    return this.snapshot;
  };

  get(id: string): AllemDevPlugin | undefined {
    return this.plugins.get(id);
  }

  getCount(): number {
    return this.plugins.size;
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private notify(): void {
    this.snapshot = Array.from(this.plugins.values());
    this.listeners.forEach((fn) => fn());
  }
}
