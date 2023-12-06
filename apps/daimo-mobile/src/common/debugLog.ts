const n = 400;
const logs: string[] = [];

// Hooks console.log, saves a rolling log of the last n lines.
export function initDebugLog() {
  console.log = createLogFunc("log", console.log);
  console.warn = createLogFunc("WRN", console.warn);
  console.error = createLogFunc("ERR", console.error);
}

function createLogFunc(type: string, oldLog: (...args: any[]) => void) {
  return (...args: any[]) => {
    // Print to console in local development.
    oldLog(...args);

    // Save to rolling buffer.
    const timestamp = new Date().toISOString();
    const parts = args.map((a) => {
      if (typeof a === "string") return a;
      if (a instanceof Error) return a.stack || a.toString();
      try {
        return JSON.stringify(a);
      } catch {
        return "" + a;
      }
    });
    let line = [timestamp, type, ...parts].join(" ");
    if (line.length > 5000) line = line.slice(0, 5000) + "...";
    logs.push(line);

    // Don't let the buffer get too long
    if (logs.length > n) logs.shift();
  };
}

export function getDebugLog(headerLines: string[]) {
  const now = new Date().toISOString();
  const log = logs.join("\n") + `\n${now} - debug log captured`;
  return [`# Daimo Debug Log`, ...headerLines, log].join("\n\n");
}
