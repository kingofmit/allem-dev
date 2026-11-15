import React from "react";
import type { ThemeTokens } from "../theme";

export interface CopyButtonProps {
  text: string;
  label?: string;
  theme: ThemeTokens;
}

export function CopyButton({ text, label, theme }: CopyButtonProps): React.ReactElement {
  const [copied, setCopied] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);

  const handleClick = React.useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return React.createElement(
    "button",
    {
      type: "button" as const,
      onClick: handleClick,
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      style: {
        background: hovered ? "rgba(255,255,255,0.04)" : "none",
        border: `1px solid ${hovered ? theme.textFaint : theme.border}`,
        color: copied ? theme.success : hovered ? theme.text : theme.textMuted,
        cursor: "pointer",
        padding: "2px 8px",
        borderRadius: 4,
        fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
        fontSize: 11,
        transition: "background 0.1s, border-color 0.1s, color 0.1s",
      },
    },
    copied ? "Copied!" : (label ?? "Copy")
  );
}
