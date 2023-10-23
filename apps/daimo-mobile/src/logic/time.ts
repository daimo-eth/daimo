import { useEffect, useState } from "react";

/** Returns the current time in Unix seconds. Ticks every `secs`. */
export function useTime(secs: number = 1) {
  const [time, setTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), secs * 1000);
    return () => clearInterval(interval);
  }, []);

  return Math.floor(time / 1000);
}
