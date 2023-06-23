import { useCallback, useState } from "react";

type ActStatus = "idle" | "loading" | "success" | "error";

export type SetActStatus = (
  status: ActStatus | Error,
  message?: string
) => void;

/** Progress & outcome of a long-running user action. */
export interface ActHandle {
  /** Action status */
  status: ActStatus;
  /** Empty when idle. Describes progress, success, or failure. */
  message: string;
  /** Should be called only when status is 'idle' */
  exec: () => void;
}

/** Tracks progress of a user action. */
export function useActStatus() {
  const [as, set] = useState({ status: "idle" as ActStatus, message: "" });

  let startTime = 0;

  // TODO: track timing and reliability
  const setAS: SetActStatus = useCallback(
    (status: ActStatus | Error, message?: string) => {
      if (typeof status !== "string") {
        if (message == null) message = status.message;
        status = "error";
      }
      if (message == null) message = "";

      // Basic performance tracking, console only for now
      if (status === "loading") {
        if (startTime === 0) startTime = Date.now();
      }
      if (startTime) {
        const elapsedMs = Date.now() - startTime;
        console.log(`[ACTION] ${elapsedMs}ms: ${status} ${message}`);
        if (status !== "loading") {
          startTime = 0;
          console.log(`[ACTION] ${status}, total time ${elapsedMs}ms`);
        }
      }

      set({ status, message });
    },
    []
  );

  return [as, setAS] as const;
}
