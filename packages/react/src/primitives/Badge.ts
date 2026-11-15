import React from "react";
import type { ThemeTokens } from "../theme";
import { badgeStyle } from "../theme";

export interface BadgeProps {
  count: number;
  color?: string;
  theme: ThemeTokens;
}

export function Badge({ count, color, theme }: BadgeProps): React.ReactElement | null {
  if (count === 0) return null;
  return React.createElement(
    "span",
    { style: badgeStyle(color ?? theme.accent) },
    count
  );
}
