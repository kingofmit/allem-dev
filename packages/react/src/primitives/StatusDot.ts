import React from "react";
import type { CSSProperties } from "react";

export interface StatusDotProps {
  color: string;
}

export function StatusDot({ color }: StatusDotProps): React.ReactElement {
  const style: CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
  };

  return React.createElement("span", { style });
}
