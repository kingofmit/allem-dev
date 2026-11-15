import { describe, it, expect, vi, afterEach } from "vitest";
import { uid, formatMs, formatBytes, timeAgo } from "./time";

describe("uid", () => {
  it('generates unique IDs with "ad_" prefix', () => {
    const a = uid();
    const b = uid();
    expect(a).toMatch(/^ad_/);
    expect(b).toMatch(/^ad_/);
    expect(a).not.toBe(b);
  });
});

describe("formatMs", () => {
  it("formats sub-millisecond as microseconds", () => {
    expect(formatMs(0.5)).toBe("500\u03BCs");
    expect(formatMs(0.001)).toBe("1\u03BCs");
  });

  it("formats milliseconds", () => {
    expect(formatMs(1)).toBe("1.0ms");
    expect(formatMs(123.456)).toBe("123.5ms");
    expect(formatMs(999)).toBe("999.0ms");
  });

  it("formats seconds", () => {
    expect(formatMs(1000)).toBe("1.00s");
    expect(formatMs(2500)).toBe("2.50s");
  });
});

describe("formatBytes", () => {
  it("formats bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1023)).toBe("1023 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(1048576)).toBe("1.0 MB");
    expect(formatBytes(2621440)).toBe("2.5 MB");
  });
});

describe("timeAgo", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns "just now" for < 1 second ago', () => {
    vi.spyOn(Date, "now").mockReturnValue(1000);
    expect(timeAgo(500)).toBe("just now");
  });

  it("returns seconds ago", () => {
    vi.spyOn(Date, "now").mockReturnValue(10000);
    expect(timeAgo(5000)).toBe("5s ago");
  });

  it("returns minutes ago", () => {
    vi.spyOn(Date, "now").mockReturnValue(180000);
    expect(timeAgo(0)).toBe("3m ago");
  });

  it("returns hours ago", () => {
    vi.spyOn(Date, "now").mockReturnValue(7200000);
    expect(timeAgo(0)).toBe("2h ago");
  });
});
