/** Returns "now", "1m", "2h", etc. Long form: "just now", "1m go", ... */
export function timeAgo(sinceS: number, nowS: number, long?: boolean) {
  const seconds = Math.floor(nowS - sinceS);
  if (seconds < 60) return long ? `just now` : `now`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m` + (long ? ` ago` : ``);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h` + (long ? ` ago` : ``);
  const days = Math.floor(hours / 24);
  return `${days}d` + (long ? ` ago` : ``);
}

/** Returns eg "Aug 4 2023, 4:00pm" */
export function timeString(s: number) {
  const date = new Date(s * 1000);
  return date.toLocaleString([], {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function guessTimestampFromNum(
  blockNum: number | bigint,
  network: string
) {
  if (typeof blockNum === "bigint") blockNum = Number(blockNum);
  switch (network) {
    case "base-goerli":
      return 1675193616 + blockNum * 2;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}
