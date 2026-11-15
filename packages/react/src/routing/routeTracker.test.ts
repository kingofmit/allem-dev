import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { trackRouteChanges } from "./routeTracker";
import { StateStore } from "@allem-dev/state";

describe("trackRouteChanges", () => {
  let stateStore: StateStore;
  let originalPushState: typeof history.pushState;
  let originalReplaceState: typeof history.replaceState;

  beforeEach(() => {
    stateStore = new StateStore();
    originalPushState = history.pushState;
    originalReplaceState = history.replaceState;
  });

  afterEach(() => {
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
  });

  it("wraps history.pushState and replaceState", () => {
    const cleanup = trackRouteChanges(stateStore);

    expect(history.pushState).not.toBe(originalPushState);
    expect(history.replaceState).not.toBe(originalReplaceState);

    cleanup();
  });

  it("calling pushState records state change with store=router and action=pushState", () => {
    const cleanup = trackRouteChanges(stateStore);

    history.pushState({}, "", "/new-page");

    const entries = stateStore.getAll();
    expect(entries.length).toBeGreaterThanOrEqual(1);

    const entry = entries.find((e) => e.action === "pushState");
    expect(entry).toBeDefined();
    expect(entry!.store).toBe("router");
    expect(entry!.key).toBe("location");
    expect(entry!.action).toBe("pushState");

    cleanup();
  });

  it("calling replaceState records with action=replaceState", () => {
    const cleanup = trackRouteChanges(stateStore);

    history.replaceState({}, "", "/replaced-page");

    const entries = stateStore.getAll();
    const entry = entries.find((e) => e.action === "replaceState");
    expect(entry).toBeDefined();
    expect(entry!.store).toBe("router");
    expect(entry!.key).toBe("location");
    expect(entry!.action).toBe("replaceState");

    cleanup();
  });

  it("records previousValue and nextValue on navigation", () => {
    const cleanup = trackRouteChanges(stateStore);

    const urlBefore = window.location.href;
    history.pushState({}, "", "/tracked-page");

    const entries = stateStore.getAll();
    const entry = entries.find((e) => e.action === "pushState");
    expect(entry).toBeDefined();
    expect(entry!.previousValue).toBe(urlBefore);
    expect((entry!.nextValue as string)).toContain("/tracked-page");

    cleanup();
  });

  it("cleanup restores original history methods", () => {
    const cleanup = trackRouteChanges(stateStore);
    cleanup();

    expect(history.pushState).toBe(originalPushState);
    expect(history.replaceState).toBe(originalReplaceState);
  });

  it("cleanup removes popstate listener", () => {
    const cleanup = trackRouteChanges(stateStore);

    // Navigate to set up some state
    history.pushState({}, "", "/before-cleanup");
    const countBefore = stateStore.getAll().length;

    cleanup();

    // Dispatching popstate after cleanup should not add entries
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(stateStore.getAll().length).toBe(countBefore);
  });

  it("does not record when URL has not changed", () => {
    const cleanup = trackRouteChanges(stateStore);

    // pushState with same URL as current (null path means no change)
    const currentUrl = window.location.href;
    history.pushState({}, "", currentUrl);

    // The tracker should skip recording since the URL did not change
    // (after the initial previousUrl is set)
    const pushEntries = stateStore.getAll().filter((e) => e.action === "pushState");
    // Since the URL didn't actually change, there should be no entry
    expect(pushEntries).toHaveLength(0);

    cleanup();
  });
});
