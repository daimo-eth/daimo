const n = 400;
const logs: string[] = [];

// Hooks console.log, saves a rolling log of the last n lines.
export function initDebugLog() {
  const oldLog = console.log;
  console.log = (...args) => {
    // Print to console in local development.
    oldLog(...args);

    // Save to rolling buffer.
    const timestamp = new Date().toISOString();
    const parts = args.map((a) => {
      if (typeof a === "string") return a;
      try {
        return JSON.stringify(a);
      } catch {
        return "" + a;
      }
    });
    logs.push([timestamp, ...parts].join(" "));

    // Don't let the buffer get too long
    if (logs.length > n) logs.shift();
  };
}

export function getDebugLog() {
  const now = new Date().toISOString();
  return logs.join("\n") + `\n${now} - debug log captured`;
}
