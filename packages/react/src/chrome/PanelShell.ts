import React from "react";
import type { ThemeTokens } from "../theme";
import { panelFont } from "../theme";
import { Z_INDEX } from "../constants";

export interface PanelShellProps {
  position: "bottom" | "right" | "floating";
  size: number;
  theme: ThemeTokens;
  opacity: number;
  children?: React.ReactNode;
}

export function PanelShell({ position, size, theme, opacity, children }: PanelShellProps): React.ReactElement {
  const base: React.CSSProperties = {
    position: "fixed",
    zIndex: Z_INDEX,
    background: theme.bg,
    color: theme.text,
    ...panelFont(),
    display: "flex",
    flexDirection: "column",
    backdropFilter: "blur(12px)",
    opacity,
    overflow: "hidden",
    pointerEvents: "auto" as const,
    boxShadow: position === "floating"
      ? "0 4px 24px rgba(0,0,0,0.4)"
      : "none",
  };

  let positionStyles: React.CSSProperties;

  switch (position) {
    case "bottom":
      positionStyles = {
        bottom: 0,
        left: 0,
        right: 0,
        height: size,
        borderTop: `1px solid ${theme.border}`,
      };
      break;
    case "right":
      positionStyles = {
        top: 0,
        right: 0,
        bottom: 0,
        width: size,
        borderLeft: `1px solid ${theme.border}`,
      };
      break;
    case "floating":
      positionStyles = {
        bottom: 60,
        right: 16,
        width: 600,
        height: size,
        borderRadius: 8,
        border: `1px solid ${theme.border}`,
      };
      break;
  }

  return React.createElement("div", {
    style: { ...base, ...positionStyles },
    "data-allem-dev": "panel",
  }, children);
}
