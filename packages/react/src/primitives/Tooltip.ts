import React from "react";
import type { CSSProperties } from "react";
import type { ThemeTokens } from "../theme";

export interface TooltipProps {
  text: string;
  children: React.ReactNode;
  theme: ThemeTokens;
}

export function Tooltip({ text, children, theme }: TooltipProps): React.ReactElement {
  const [visible, setVisible] = React.useState(false);

  const tipStyle: CSSProperties = {
    position: "absolute",
    bottom: "100%",
    left: "50%",
    transform: "translateX(-50%)",
    marginBottom: 4,
    background: theme.surface,
    color: theme.text,
    padding: "4px 8px",
    borderRadius: 4,
    fontSize: 11,
    whiteSpace: "nowrap",
    pointerEvents: "none",
    zIndex: 10,
  };

  return React.createElement(
    "span",
    {
      style: { position: "relative", display: "inline-flex" } as CSSProperties,
      onMouseEnter: () => setVisible(true),
      onMouseLeave: () => setVisible(false),
    },
    children,
    visible ? React.createElement("span", { style: tipStyle }, text) : null
  );
}
