import { DaimoChain } from "@daimo/contract";

/** Returns current unix time, in seconds */
export function now() {
  return Math.floor(Date.now() / 1000);
}

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

/** Returns eg "12/11/2023, 10:44" */
export function timeString(s: number) {
  const date = new Date(s * 1000);
  return date.toLocaleString([], {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    dayPeriod: "short",
  });
}

/** Returns eg "Aug 2023" */
export function timeMonth(s: number) {
  const date = new Date(s * 1000);
  return date.toLocaleString([], {
    month: "short",
    year: "numeric",
  });
}

export function guessTimestampFromNum(
  blockNum: number | bigint,
  chain: DaimoChain
) {
  if (typeof blockNum === "bigint") blockNum = Number(blockNum);
  switch (chain) {
    case "baseSepolia":
      return 1695768288 + blockNum * 2;
    case "base":
      return 1686789347 + blockNum * 2;
    default:
      throw new Error(`Unsupported network: ${chain}`);
  }
}
