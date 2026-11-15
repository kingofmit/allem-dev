import { useState, useEffect, useCallback } from "react";
import type { RefObject } from "react";

/**
 * Keyboard navigation for the dev panel.
 *
 * - Escape: close the panel
 * - Tab / Shift+Tab: cycle through tab bar items
 * - ArrowUp / ArrowDown: move focus index within the active list
 */
export function usePanelKeyboard(
  panelRef: RefObject<HTMLElement | null>,
  isVisible: boolean,
  onClose: () => void,
  tabIds: string[],
  activeTab: string,
  onTabChange: (tabId: string) => void,
): { focusedIndex: number; setFocusedIndex: (i: number) => void } {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        const currentIdx = tabIds.indexOf(activeTab);
        if (currentIdx === -1) return;

        const next = e.shiftKey
          ? (currentIdx - 1 + tabIds.length) % tabIds.length
          : (currentIdx + 1) % tabIds.length;

        onTabChange(tabIds[next]);
        setFocusedIndex(0);
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(0, prev - 1));
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => prev + 1);
        return;
      }
    },
    [onClose, tabIds, activeTab, onTabChange],
  );

  useEffect(() => {
    if (!isVisible) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, handleKeyDown]);

  return { focusedIndex, setFocusedIndex };
}
