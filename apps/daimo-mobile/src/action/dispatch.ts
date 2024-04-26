import { DaimoRequestV2Status, ProposedSwap } from "@daimo/common";
import { ReactElement, createContext } from "react";

export type Action =
  | { name: "connectFarcaster" }
  | { name: "linkFarcaster" }
  | { name: "onboardingChecklist" }
  | { name: "depositAddress" }
  | { name: "withdrawInstructions" }
  | { name: "helpModal"; title: string; content: ReactElement }
  | { name: "ownRequest"; reqStatus: DaimoRequestV2Status }
  | { name: "createBackup" }
  | { name: "hideBottomSheet" }
  | { name: "swap"; swap: ProposedSwap };

type ActionName = Action["name"];

// Dispatcher. Coordinates global state.
// TODO: route account updates through here.
// TODO: route all onchain actions through here.
export class Dispatcher {
  handlers = new Map<ActionName, (action: Action) => void>();

  register(name: ActionName, handler: (action: Action) => void) {
    if (this.handlers.has(name)) {
      console.warn(`[DISPATCH] handler for ${name} already registered`);
    }
    this.handlers.set(name, handler);
    return () => {
      this.handlers.delete(name);
    };
  }

  dispatch(action: Action) {
    console.log(`[DISPATCH] ${action.name}`);
    const handler = this.handlers.get(action.name);
    if (!handler) {
      throw new Error(`No handler for action: ${action.name}`);
    }
    handler(action);
  }
}

export const DispatcherContext = createContext<Dispatcher>(new Dispatcher());
