import React from "react";
import type { CSSProperties } from "react";
import type { ThemeTokens } from "../theme";

export interface SearchInputProps {
  value: string;
  onSearch: (term: string) => void;
  placeholder?: string;
  theme: ThemeTokens;
}

export function SearchInput({ value, onSearch, placeholder, theme }: SearchInputProps): React.ReactElement {
  const [local, setLocal] = React.useState(value);
  const [focused, setFocused] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setLocal(v);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onSearch(v), 150);
    },
    [onSearch]
  );

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const inputStyle: CSSProperties = {
    background: theme.bgAlt,
    border: `1px solid ${focused ? theme.accent : theme.border}`,
    color: theme.text,
    fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 4,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  const clearStyle: CSSProperties = {
    position: "absolute",
    right: 4,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: theme.textMuted,
    cursor: "pointer",
    fontSize: 14,
    lineHeight: 1,
    padding: 0,
  };

  return React.createElement(
    "span",
    { style: { position: "relative", display: "flex", width: "100%" } as CSSProperties },
    React.createElement("input", {
      type: "text",
      value: local,
      onChange: handleChange,
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
      placeholder: placeholder ?? "Filter\u2026",
      style: inputStyle,
    }),
    local
      ? React.createElement(
          "button",
          {
            type: "button" as const,
            onClick: () => {
              setLocal("");
              onSearch("");
            },
            style: clearStyle,
          },
          "\u00d7"
        )
      : null
  );
}
