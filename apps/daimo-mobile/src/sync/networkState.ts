import { ignore } from "@daimo/common";
import { useEffect, useState } from "react";

type NetworkState = "online" | "offline" | "connecting";

let currentState: NetworkState = "connecting";
const listeners = new Set<(state: NetworkState) => void>();

export function useNetworkState() {
  const [state, setState] = useState<NetworkState>(currentState);

  useEffect(() => {
    listeners.add(setState);
    return () => ignore(listeners.delete(setState));
  }, []);

  return state;
}

export function setNetworkState(state: NetworkState) {
  currentState = state;
  listeners.forEach((listener) => listener(state));
}
