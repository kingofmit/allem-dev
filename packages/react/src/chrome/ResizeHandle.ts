import React from "react";
import type { ThemeTokens } from "../theme";

export interface ResizeHandleProps {
  position: "bottom" | "right" | "floating";
  onPointerDown: (e: React.PointerEvent) => void;
  theme: ThemeTokens;
}

export function ResizeHandle({ position, onPointerDown, theme }: ResizeHandleProps): React.ReactElement {
  const isHorizontal = position === "bottom" || position === "floating";
  const [hovered, setHovered] = React.useState(false);

  return React.createElement("div", {
    style: {
      position: "absolute" as const,
      ...(isHorizontal
        ? { top: 0, left: 0, right: 0, height: 8, cursor: "row-resize" }
        : { top: 0, left: 0, bottom: 0, width: 8, cursor: "col-resize" }),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
      userSelect: "none" as const,
    },
    onPointerDown,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  },
    React.createElement("div", {
      style: {
        ...(isHorizontal
          ? { width: 32, height: 4, borderRadius: 2 }
          : { width: 4, height: 32, borderRadius: 2 }),
        background: hovered ? theme.textFaint : theme.borderLight,
        transition: "background 0.15s",
      },
    }),
  );
}
