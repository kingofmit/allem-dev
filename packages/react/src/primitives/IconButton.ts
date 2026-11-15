import React from "react";
import type { CSSProperties } from "react";
import type { ThemeTokens } from "../theme";

export interface IconButtonProps {
  icon: string;
  onClick: () => void;
  title?: string;
  theme: ThemeTokens;
  style?: CSSProperties;
}

export function IconButton({ icon, onClick, title, theme, style }: IconButtonProps): React.ReactElement {
  const base: CSSProperties = {
    background: "none",
    border: "none",
    color: theme.textMuted,
    cursor: "pointer",
    width: 24,
    height: 24,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    fontSize: 14,
    lineHeight: 1,
  };

  return React.createElement(
    "button",
    { style: { ...base, ...style }, onClick, title, type: "button" as const },
    icon
  );
}
