import React from "react";
import type { CSSProperties } from "react";

export interface VirtualListProps {
  items: unknown[];
  rowHeight: number;
  renderRow: (item: any, index: number) => React.ReactElement;
  height: number;
  overscan?: number;
}

export function VirtualList({
  items,
  rowHeight,
  renderRow,
  height,
  overscan = 5,
}: VirtualListProps): React.ReactElement {
  const [scrollTop, setScrollTop] = React.useState(0);
  const outerRef = React.useRef<HTMLDivElement | null>(null);

  const totalHeight = items.length * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(height / rowHeight) + 2 * overscan;
  const endIndex = Math.min(items.length, startIndex + visibleCount);

  const handleScroll = React.useCallback(() => {
    if (outerRef.current) {
      setScrollTop(outerRef.current.scrollTop);
    }
  }, []);

  const outerStyle: CSSProperties = {
    overflow: "auto",
    height,
    position: "relative",
  };

  const innerStyle: CSSProperties = {
    height: totalHeight,
    position: "relative",
  };

  const visibleItems: React.ReactElement[] = [];
  for (let i = startIndex; i < endIndex; i++) {
    const itemStyle: CSSProperties = {
      position: "absolute",
      top: i * rowHeight,
      left: 0,
      right: 0,
      height: rowHeight,
    };
    visibleItems.push(
      React.createElement("div", { key: i, style: itemStyle }, renderRow(items[i], i))
    );
  }

  return React.createElement(
    "div",
    { ref: outerRef, style: outerStyle, onScroll: handleScroll },
    React.createElement("div", { style: innerStyle }, ...visibleItems)
  );
}
