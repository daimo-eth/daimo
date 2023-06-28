import { useEffect, useState } from "react";

/** Returns the current time in Unix seconds. Ticks every second. */
export function useTime() {
  const [time, setTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  return time / 1000;
}

/** Returns "just now", "4s", "1m", "2h", etc. */
export function timeAgoS(sinceS: number, nowS: number) {
  const seconds = Math.floor(nowS - sinceS);
  if (seconds < -30) return "⚠️ future";
  if (seconds < 1) return "just now";
  if (seconds < 60) return `${seconds}s`;
  return timeAgo(sinceS, nowS);
}

/** Returns "now", "1m", "2h", etc. */
export function timeAgo(sinceS: number, nowS: number) {
  const seconds = Math.floor(nowS - sinceS);
  if (seconds < 60) return `now`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

/** Returns eg "Aug 4 2023, 4:00pm" */
export function timeString(s: number) {
  const date = new Date(s * 1000);
  return date.toLocaleString();
}
