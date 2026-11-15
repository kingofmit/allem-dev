import React from "react";

export interface BoltIconProps {
  size?: number;
  glow?: boolean;
}

/**
 * Custom lightning bolt icon matching the Allem Dev banner style.
 * Bolder and more geometric than the Lucide Zap icon, with an
 * optional teal glow effect.
 */
export function BoltIcon({ size = 16, glow = false }: BoltIconProps): React.ReactElement {
  const glowFilter = glow
    ? React.createElement("defs", null,
        React.createElement("filter", { id: "bolt-glow", x: "-50%", y: "-50%", width: "200%", height: "200%" },
          React.createElement("feGaussianBlur", { stdDeviation: "2", result: "blur" }),
          React.createElement("feMerge", null,
            React.createElement("feMergeNode", { in: "blur" }),
            React.createElement("feMergeNode", { in: "SourceGraphic" }),
          ),
        ),
      )
    : null;

  return React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    style: { display: "inline-block", verticalAlign: "middle", flexShrink: 0 },
  },
    glowFilter,
    React.createElement("path", {
      d: "M13 2L4.5 13.5H11.5L10.5 22L19.5 10.5H12.5L13 2Z",
      fill: "currentColor",
      stroke: "currentColor",
      strokeWidth: 0.5,
      strokeLinejoin: "round",
      filter: glow ? "url(#bolt-glow)" : undefined,
    }),
  );
}
