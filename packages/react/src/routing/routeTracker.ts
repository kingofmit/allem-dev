import type { StateStore } from "@allem-dev/state";

/**
 * Tracks route changes by:
 * 1. Listening to popstate events
 * 2. Wrapping history.pushState and history.replaceState
 *
 * Records each navigation as a state change in the StateStore
 * with store="router", key="location".
 */
export function trackRouteChanges(stateStore: StateStore): () => void {
  let previousUrl = window.location.href;

  function recordNavigation(action: string) {
    const currentUrl = window.location.href;
    if (currentUrl === previousUrl) return;

    stateStore.record({
      store: "router",
      key: "location",
      timestamp: Date.now(),
      previousValue: previousUrl,
      nextValue: currentUrl,
      action,
    });
    previousUrl = currentUrl;
  }

  // Wrap pushState
  const originalPushState = history.pushState;
  history.pushState = function (this: History, ...args: Parameters<typeof history.pushState>) {
    originalPushState.apply(this, args);
    recordNavigation("pushState");
  };

  // Wrap replaceState
  const originalReplaceState = history.replaceState;
  history.replaceState = function (this: History, ...args: Parameters<typeof history.replaceState>) {
    originalReplaceState.apply(this, args);
    recordNavigation("replaceState");
  };

  // Listen to popstate (back/forward)
  const onPopState = () => recordNavigation("popstate");
  window.addEventListener("popstate", onPopState);

  return () => {
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
    window.removeEventListener("popstate", onPopState);
  };
}
