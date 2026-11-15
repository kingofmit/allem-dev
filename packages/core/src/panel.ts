import { DevTab, PanelConfig, DEFAULT_CONFIG } from "./types";

/** Panel state manager */
export class PanelManager {
  private tabs: DevTab[] = [];
  private activeTab: string;
  private visible = false;
  private config: PanelConfig;
  private listeners = new Set<() => void>();

  constructor(config: Partial<PanelConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.activeTab = this.config.defaultTab;
  }

  registerTab(tab: DevTab): void {
    if (!this.tabs.find((t) => t.id === tab.id)) {
      this.tabs.push(tab);
      this.notify();
    }
  }

  unregisterTab(id: string): void {
    this.tabs = this.tabs.filter((t) => t.id !== id);
    if (this.activeTab === id && this.tabs.length > 0) {
      this.activeTab = this.tabs[0].id;
    }
    this.notify();
  }

  setActiveTab(id: string): void {
    this.activeTab = id;
    this.notify();
  }

  toggle(): void {
    this.visible = !this.visible;
    this.notify();
  }

  show(): void { this.visible = true; this.notify(); }
  hide(): void { this.visible = false; this.notify(); }

  isVisible(): boolean { return this.visible; }
  getActiveTab(): string { return this.activeTab; }
  getTabs(): DevTab[] { return [...this.tabs]; }
  getConfig(): PanelConfig { return { ...this.config }; }

  updateBadge(tabId: string, count: number): void {
    const tab = this.tabs.find((t) => t.id === tabId);
    if (tab) { tab.badge = count; this.notify(); }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}
