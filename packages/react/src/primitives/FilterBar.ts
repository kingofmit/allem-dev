import React from "react";
import type { CSSProperties } from "react";
import type { ThemeTokens } from "../theme";

export interface FilterItem {
  id: string;
  label: string;
  active: boolean;
}

export interface FilterBarProps {
  filters: FilterItem[];
  onToggle: (id: string) => void;
  theme: ThemeTokens;
}

function FilterPill({
  filter,
  onToggle,
  theme,
}: {
  filter: FilterItem;
  onToggle: (id: string) => void;
  theme: ThemeTokens;
}): React.ReactElement {
  const [hovered, setHovered] = React.useState(false);
  const active = filter.active;

  const pillStyle: CSSProperties = {
    padding: "2px 8px",
    borderRadius: 10,
    fontSize: 11,
    cursor: "pointer",
    background: active
      ? theme.accent
      : hovered ? "rgba(255,255,255,0.04)" : "transparent",
    filter: active && hovered ? "brightness(1.15)" : "none",
    color: active ? "#fff" : hovered ? theme.text : theme.textMuted,
    border: active
      ? "1px solid transparent"
      : `1px solid ${hovered ? theme.textFaint : theme.border}`,
    fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
    lineHeight: 1.4,
    transition: "background 0.1s, border-color 0.1s, color 0.1s",
  };

  return React.createElement(
    "button",
    {
      key: filter.id,
      type: "button" as const,
      style: pillStyle,
      onClick: () => onToggle(filter.id),
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
    },
    filter.label
  );
}

export function FilterBar({ filters, onToggle, theme }: FilterBarProps): React.ReactElement {
  const containerStyle: CSSProperties = {
    display: "flex",
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    flexWrap: "wrap",
  };

  return React.createElement(
    "div",
    { style: containerStyle },
    filters.map((f) =>
      React.createElement(FilterPill, {
        key: f.id,
        filter: f,
        onToggle,
        theme,
      })
    )
  );
}
