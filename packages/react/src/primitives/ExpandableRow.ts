import React from "react";
import type { CSSProperties } from "react";

export interface ExpandableRowProps {
  header: React.ReactElement;
  children: React.ReactElement;
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
}

export function ExpandableRow({ header, children, defaultExpanded = false, onToggle }: ExpandableRowProps): React.ReactElement {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const [hovered, setHovered] = React.useState(false);

  const toggle = React.useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      if (onToggle) onToggle(next);
      return next;
    });
  }, [onToggle]);

  const chevronStyle: CSSProperties = {
    display: "inline-block",
    width: 16,
    fontSize: 10,
    userSelect: "none",
    flexShrink: 0,
  };

  const headerRow: CSSProperties = {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    background: hovered ? "rgba(255,255,255,0.03)" : "transparent",
    transition: "background 0.1s",
    borderRadius: 3,
  };

  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      {
        style: headerRow,
        onClick: toggle,
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
      },
      React.createElement("span", { style: chevronStyle }, expanded ? "\u25bc" : "\u25b6"),
      header
    ),
    expanded ? children : null
  );
}
