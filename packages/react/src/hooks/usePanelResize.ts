import { useState, useRef, useCallback } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { MIN_PANEL_SIZE, MAX_PANEL_RATIO, LS_KEY_HEIGHT, LS_KEY_WIDTH } from "../constants";

/**
 * Drag-to-resize logic for the dev panel.
 *
 * Captures the pointer on the resize handle, tracks movement, constrains
 * the size, and persists the final value to localStorage on pointer up.
 */
export function usePanelResize(
  position: "bottom" | "right" | "floating",
  initialSize: number,
): { size: number; onPointerDown: (e: ReactPointerEvent) => void } {
  const [size, setSize] = useState(initialSize);
  const draggingRef = useRef(false);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
      draggingRef.current = true;

      const handleMove = (ev: globalThis.PointerEvent) => {
        if (!draggingRef.current) return;

        let newSize: number;
        if (position === "bottom") {
          newSize = window.innerHeight - ev.clientY;
        } else if (position === "right") {
          newSize = window.innerWidth - ev.clientX;
        } else {
          // floating — no resize via drag
          return;
        }

        const maxSize =
          position === "bottom"
            ? window.innerHeight * MAX_PANEL_RATIO
            : window.innerWidth * MAX_PANEL_RATIO;

        newSize = Math.max(MIN_PANEL_SIZE, Math.min(newSize, maxSize));
        setSize(newSize);
      };

      const handleUp = () => {
        draggingRef.current = false;
        document.removeEventListener("pointermove", handleMove);
        document.removeEventListener("pointerup", handleUp);

        // Persist the final size
        try {
          const key = position === "bottom" ? LS_KEY_HEIGHT : LS_KEY_WIDTH;
          localStorage.setItem(key, JSON.stringify(size));
        } catch {
          // ignore
        }
      };

      document.addEventListener("pointermove", handleMove);
      document.addEventListener("pointerup", handleUp);
    },
    [position, size],
  );

  return { size, onPointerDown };
}
