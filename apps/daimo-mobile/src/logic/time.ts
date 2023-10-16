import { guessTimestampFromNum } from "@daimo/common";
import { chainConfig } from "@daimo/contract";
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

/** Returns the timestamp, in Unix seconds, for a given L2 block number. */
export function timestampForBlock(blockNum: number) {
  return guessTimestampFromNum(blockNum, chainConfig.chainL2.network);
}
