import { describe, it, expect, vi } from "vitest";
import { PanelManager } from "./panel";
import { DEFAULT_CONFIG, DevTab } from "./types";

function makeTab(id: string, label?: string): DevTab {
  return { id, label: label ?? id };
}

describe("PanelManager", () => {
  it("constructor uses DEFAULT_CONFIG values", () => {
    const pm = new PanelManager();
    const config = pm.getConfig();
    expect(config).toEqual(DEFAULT_CONFIG);
    expect(pm.getActiveTab()).toBe(DEFAULT_CONFIG.defaultTab);
  });

  it("constructor merges partial config", () => {
    const pm = new PanelManager({ height: 999, theme: "light" });
    const config = pm.getConfig();
    expect(config.height).toBe(999);
    expect(config.theme).toBe("light");
    expect(config.shortcut).toBe(DEFAULT_CONFIG.shortcut);
  });

  it("registerTab() adds tab", () => {
    const pm = new PanelManager();
    pm.registerTab(makeTab("net"));
    expect(pm.getTabs()).toHaveLength(1);
    expect(pm.getTabs()[0].id).toBe("net");
  });

  it("registerTab() deduplicates by id", () => {
    const pm = new PanelManager();
    pm.registerTab(makeTab("net"));
    pm.registerTab(makeTab("net"));
    expect(pm.getTabs()).toHaveLength(1);
  });

  it("unregisterTab() removes tab, falls back active if removed", () => {
    const pm = new PanelManager();
    pm.registerTab(makeTab("a"));
    pm.registerTab(makeTab("b"));
    pm.setActiveTab("b");
    expect(pm.getActiveTab()).toBe("b");

    pm.unregisterTab("b");
    expect(pm.getTabs()).toHaveLength(1);
    expect(pm.getActiveTab()).toBe("a");
  });

  it("setActiveTab() changes active tab", () => {
    const pm = new PanelManager();
    pm.registerTab(makeTab("x"));
    pm.setActiveTab("x");
    expect(pm.getActiveTab()).toBe("x");
  });

  it("toggle() flips visibility", () => {
    const pm = new PanelManager();
    expect(pm.isVisible()).toBe(false);
    pm.toggle();
    expect(pm.isVisible()).toBe(true);
    pm.toggle();
    expect(pm.isVisible()).toBe(false);
  });

  it("show() sets visibility to true", () => {
    const pm = new PanelManager();
    pm.show();
    expect(pm.isVisible()).toBe(true);
  });

  it("hide() sets visibility to false", () => {
    const pm = new PanelManager();
    pm.show();
    pm.hide();
    expect(pm.isVisible()).toBe(false);
  });

  it("isVisible() returns current state", () => {
    const pm = new PanelManager();
    expect(pm.isVisible()).toBe(false);
    pm.show();
    expect(pm.isVisible()).toBe(true);
  });

  it("getActiveTab() returns current tab", () => {
    const pm = new PanelManager({ defaultTab: "renders" });
    expect(pm.getActiveTab()).toBe("renders");
  });

  it("getTabs() returns copy", () => {
    const pm = new PanelManager();
    pm.registerTab(makeTab("a"));
    const tabs = pm.getTabs();
    tabs.push(makeTab("injected"));
    expect(pm.getTabs()).toHaveLength(1);
  });

  it("getConfig() returns copy", () => {
    const pm = new PanelManager();
    const config = pm.getConfig();
    config.height = 9999;
    expect(pm.getConfig().height).toBe(DEFAULT_CONFIG.height);
  });

  it("updateBadge() updates tab badge", () => {
    const pm = new PanelManager();
    pm.registerTab(makeTab("net"));
    pm.updateBadge("net", 5);
    expect(pm.getTabs()[0].badge).toBe(5);
  });

  it("subscribe() notifies on state changes", () => {
    const pm = new PanelManager();
    const cb = vi.fn();
    pm.subscribe(cb);

    pm.registerTab(makeTab("a"));
    expect(cb).toHaveBeenCalledTimes(1);

    pm.setActiveTab("a");
    expect(cb).toHaveBeenCalledTimes(2);

    pm.toggle();
    expect(cb).toHaveBeenCalledTimes(3);
  });
});
