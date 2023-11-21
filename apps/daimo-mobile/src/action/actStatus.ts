import { useCallback, useRef, useState } from "react";

export type ActStatus = "idle" | "loading" | "success" | "error";

export type SetActStatus = (
  status: ActStatus | Error,
  message?: string
) => void;

/** Progress & outcome of a long-running user action. */
export interface ActHandle {
  /** Action status */
  status: ActStatus;
  /** Action costs, including fees and total. */
  cost: { feeDollars: number; totalDollars: number };
  /** Empty when idle. Describes progress, success, or failure. */
  message: string;
  /** Should be called only when status is 'idle' */
  exec: () => void;
  /** Should be called only when status is 'success' or 'error' */
  reset?: () => void;
}

/** Tracks progress of a user action. */
export function useActStatus() {
  const [as, set] = useState({ status: "idle" as ActStatus, message: "" });

  const startTime = useRef(0);

  // TODO: track timing and reliability
  const setAS: SetActStatus = useCallback(
    (status: ActStatus | Error, message?: string) => {
      if (typeof status !== "string") {
        if (message == null) message = status.message;
        status = "error";
      }
      if (message == null) message = "";

      // Basic performance tracking, console only for now
      // TODO: ensure valid state transitions
      if (status === "loading") {
        if (as.status !== "loading") startTime.current = Date.now();
      }
      const elapsedMs = Date.now() - startTime.current;
      console.log(
        `[ACTION] ${elapsedMs}ms: ${as.status} > ${status} ${message}`
      );
      if (status !== "loading") {
        console.log(`[ACTION] ${status}, total time ${elapsedMs}ms`);
      }

      set({ status, message });
    },
    []
  );

  return [as, setAS] as const;
}
