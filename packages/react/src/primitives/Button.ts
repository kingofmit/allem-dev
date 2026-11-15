import React from "react";
import type { CSSProperties } from "react";
import type { ThemeTokens } from "../theme";

export interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "default" | "accent" | "danger";
  theme: ThemeTokens;
  style?: CSSProperties;
}

function variantBg(variant: "default" | "accent" | "danger", theme: ThemeTokens): string {
  if (variant === "accent") return theme.accent;
  if (variant === "danger") return theme.error;
  return theme.surface;
}

function variantBgHover(variant: "default" | "accent" | "danger", theme: ThemeTokens): string {
  if (variant === "accent") return theme.accent;
  if (variant === "danger") return theme.error;
  return theme.bgAlt;
}

export function Button({ label, onClick, variant = "default", theme, style }: ButtonProps): React.ReactElement {
  const [hovered, setHovered] = React.useState(false);

  const base: CSSProperties = {
    padding: "4px 10px",
    borderRadius: 4,
    border: `1px solid ${theme.border}`,
    background: hovered ? variantBgHover(variant, theme) : variantBg(variant, theme),
    color: variant === "default" ? theme.text : "#fff",
    fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
    fontSize: 12,
    cursor: "pointer",
    lineHeight: 1.4,
    transition: "background 0.1s, filter 0.1s",
    filter: hovered && variant !== "default" ? "brightness(1.15)" : "none",
  };

  return React.createElement(
    "button",
    {
      style: { ...base, ...style },
      onClick,
      type: "button" as const,
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
    },
    label
  );
}
