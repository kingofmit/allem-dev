import { uid } from "@allem-dev/core";

export interface MockRule {
  id: string;
  urlPattern: string;  // substring match or regex string
  method?: string;     // optional: only match this method
  status: number;
  headers?: Record<string, string>;
  body: unknown;
  delay?: number;      // optional delay in ms before responding
  enabled: boolean;
  hitCount: number;
}

export class MockStore {
  private rules: MockRule[] = [];
  private listeners = new Set<() => void>();

  addRule(rule: Omit<MockRule, "id" | "hitCount">): MockRule {
    const full: MockRule = { id: uid(), hitCount: 0, ...rule };
    this.rules.push(full);
    this.notify();
    return full;
  }

  removeRule(id: string): void {
    this.rules = this.rules.filter((r) => r.id !== id);
    this.notify();
  }

  toggleRule(id: string): void {
    const rule = this.rules.find((r) => r.id === id);
    if (rule) { rule.enabled = !rule.enabled; this.notify(); }
  }

  updateRule(id: string, updates: Partial<Omit<MockRule, "id" | "hitCount">>): void {
    const rule = this.rules.find((r) => r.id === id);
    if (rule) { Object.assign(rule, updates); this.notify(); }
  }

  getRules(): MockRule[] { return [...this.rules]; }

  findMatch(url: string, method: string): MockRule | null {
    return this.rules.find((r) => {
      if (!r.enabled) return false;
      if (r.method && r.method.toUpperCase() !== method.toUpperCase()) return false;
      try {
        if (new RegExp(r.urlPattern).test(url)) return r;
      } catch {
        if (url.includes(r.urlPattern)) return r;
      }
      return false;
    }) || null;
  }

  incrementHit(id: string): void {
    const rule = this.rules.find((r) => r.id === id);
    if (rule) { rule.hitCount++; this.notify(); }
  }

  clear(): void { this.rules = []; this.notify(); }
  getCount(): number { return this.rules.length; }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void { this.listeners.forEach((fn) => fn()); }
}
