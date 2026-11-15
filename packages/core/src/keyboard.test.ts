import { describe, it, expect } from "vitest";
import { parseShortcut, matchesShortcut } from "./keyboard";

describe("parseShortcut", () => {
  it('parses "ctrl+shift+d" correctly', () => {
    const result = parseShortcut("ctrl+shift+d");
    expect(result).toEqual({
      key: "d",
      ctrl: true,
      shift: true,
      alt: false,
      meta: false,
    });
  });

  it('parses "cmd+k" with meta: true', () => {
    const result = parseShortcut("cmd+k");
    expect(result).toEqual({
      key: "k",
      ctrl: false,
      shift: false,
      alt: false,
      meta: true,
    });
  });

  it('parses "alt+shift+p"', () => {
    const result = parseShortcut("alt+shift+p");
    expect(result).toEqual({
      key: "p",
      ctrl: false,
      shift: true,
      alt: true,
      meta: false,
    });
  });
});

describe("matchesShortcut", () => {
  function makeEvent(overrides: Partial<KeyboardEvent> = {}): KeyboardEvent {
    return {
      key: "d",
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      ...overrides,
    } as unknown as KeyboardEvent;
  }

  it("matches correct KeyboardEvent", () => {
    const event = makeEvent({ key: "d", ctrlKey: true, shiftKey: true });
    expect(matchesShortcut(event, "ctrl+shift+d")).toBe(true);
  });

  it("returns false for non-matching key", () => {
    const event = makeEvent({ key: "x", ctrlKey: true, shiftKey: true });
    expect(matchesShortcut(event, "ctrl+shift+d")).toBe(false);
  });

  it("returns false when modifier does not match", () => {
    const event = makeEvent({ key: "d", ctrlKey: false, shiftKey: true });
    expect(matchesShortcut(event, "ctrl+shift+d")).toBe(false);
  });

  it("matches meta key with cmd shortcut", () => {
    const event = makeEvent({ key: "k", metaKey: true });
    expect(matchesShortcut(event, "cmd+k")).toBe(true);
  });
});
