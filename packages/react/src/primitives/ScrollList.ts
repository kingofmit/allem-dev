import React from "react";
import type { CSSProperties } from "react";

export interface ScrollListProps {
  items: unknown[];
  renderRow: (item: any, index: number) => React.ReactElement;
  height: number | string;
}

/**
 * Simple scrollable list that renders all items in a flex column.
 * Unlike VirtualList, supports variable-height rows (expandable rows).
 * Suitable for lists up to ~500 items.
 */
export function ScrollList({
  items,
  renderRow,
  height,
}: ScrollListProps): React.ReactElement {
  const outerStyle: CSSProperties = {
    overflow: "auto",
    height,
    flex: typeof height === "string" && height === "100%" ? 1 : undefined,
    minHeight: 0,
  };

  const children = items.map((item, i) =>
    React.createElement("div", { key: i }, renderRow(item, i))
  );

  return React.createElement(
    "div",
    { style: outerStyle },
    ...children,
  );
}
