export interface StackFrame {
  functionName: string | null;
  fileName: string | null;
  lineNumber: number | null;
  columnNumber: number | null;
}

/** Parse an Error stack string into structured frames */
export function parseStack(stack: string): StackFrame[] {
  const lines = stack.split("\n").slice(1);
  return lines.map((line) => {
    const trimmed = line.trim();
    // Chrome format: "at functionName (file:line:col)" or "at file:line:col"
    const chromeMatch = trimmed.match(/^at\s+(?:(.+?)\s+\()?(.+):(\d+):(\d+)\)?$/);
    if (chromeMatch) {
      return {
        functionName: chromeMatch[1] || null,
        fileName: chromeMatch[2],
        lineNumber: parseInt(chromeMatch[3], 10),
        columnNumber: parseInt(chromeMatch[4], 10),
      };
    }
    // Firefox format: "functionName@file:line:col"
    const firefoxMatch = trimmed.match(/^(.+?)@(.+):(\d+):(\d+)$/);
    if (firefoxMatch) {
      return {
        functionName: firefoxMatch[1] || null,
        fileName: firefoxMatch[2],
        lineNumber: parseInt(firefoxMatch[3], 10),
        columnNumber: parseInt(firefoxMatch[4], 10),
      };
    }
    return { functionName: null, fileName: trimmed, lineNumber: null, columnNumber: null };
  }).filter((f) => f.fileName);
}
