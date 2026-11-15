import { describe, it, expect } from "vitest";
import { parseStack } from "./stack";

describe("parseStack", () => {
  it("parses Chrome format: at funcName (file.js:10:20)", () => {
    const stack = `Error: boom
    at myFunction (http://localhost:3000/app.js:10:20)
    at Object.run (http://localhost:3000/main.js:5:12)`;

    const frames = parseStack(stack);
    expect(frames).toHaveLength(2);
    expect(frames[0]).toEqual({
      functionName: "myFunction",
      fileName: "http://localhost:3000/app.js",
      lineNumber: 10,
      columnNumber: 20,
    });
    expect(frames[1]).toEqual({
      functionName: "Object.run",
      fileName: "http://localhost:3000/main.js",
      lineNumber: 5,
      columnNumber: 12,
    });
  });

  it("parses Chrome anonymous: at file.js:10:20", () => {
    const stack = `Error: boom
    at http://localhost:3000/app.js:10:20`;

    const frames = parseStack(stack);
    expect(frames).toHaveLength(1);
    expect(frames[0]).toEqual({
      functionName: null,
      fileName: "http://localhost:3000/app.js",
      lineNumber: 10,
      columnNumber: 20,
    });
  });

  it("parses Firefox format: funcName@file.js:10:20", () => {
    const stack = `Error: boom
myFunction@http://localhost:3000/app.js:10:20
run@http://localhost:3000/main.js:5:12`;

    const frames = parseStack(stack);
    expect(frames).toHaveLength(2);
    expect(frames[0]).toEqual({
      functionName: "myFunction",
      fileName: "http://localhost:3000/app.js",
      lineNumber: 10,
      columnNumber: 20,
    });
    expect(frames[1]).toEqual({
      functionName: "run",
      fileName: "http://localhost:3000/main.js",
      lineNumber: 5,
      columnNumber: 12,
    });
  });

  it("handles malformed stack lines (filters them out)", () => {
    const stack = `Error: boom
    at myFunction (http://localhost:3000/app.js:10:20)
    `;

    const frames = parseStack(stack);
    expect(frames).toHaveLength(1);
    expect(frames[0].functionName).toBe("myFunction");
  });

  it("returns empty array for empty input", () => {
    expect(parseStack("")).toEqual([]);
    expect(parseStack("Error: boom")).toEqual([]);
  });
});
