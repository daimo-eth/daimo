import { SlotType, getSlotType } from "@daimo/common";
import { useCallback, useContext } from "react";

import { getAccountManager } from "./accountManager";
import { DispatcherContext } from "../action/dispatch";
import { useNav } from "../common/nav";
import { Account } from "../storage/account";

export function useOnboardingChecklist(account: Account) {
  const nav = useNav();
  const dispatcher = useContext(DispatcherContext);

  const hasBackup = account.accountKeys.some((key) => {
    const slotType = getSlotType(key.slot);
    return (
      slotType &&
      [
        SlotType.PasskeyBackup,
        SlotType.SecurityKeyBackup,
        SlotType.SeedPhraseBackup,
      ].includes(slotType)
    );
  });

  const farcasterConnected =
    !!account.linkedAccounts.find((a) => a.type === "farcaster") ||
    account.dismissedActionIDs.includes("onboard-connectFarcaster");

  const allComplete = hasBackup && farcasterConnected;

  const handleSecureAccount = useCallback(() => {
    nav.navigate("Settings");
    dispatcher.dispatch({ name: "createBackup" });
  }, [nav, dispatcher]);

  const handleConnectFarcaster = useCallback(() => {
    nav.navigate("Settings");
    dispatcher.dispatch({ name: "connectFarcaster" });
  }, [nav, dispatcher]);

  const dismissConnectFarcaster = useCallback(() => {
    getAccountManager().transform((a) => ({
      ...a,
      dismissedActionIDs: [...a.dismissedActionIDs, "onboard-connectFarcaster"],
    }));
    dispatcher.dispatch({ name: "hideBottomSheet" });
  }, [dispatcher]);

  return {
    hasBackup,
    farcasterConnected,
    allComplete,
    handleSecureAccount,
    handleConnectFarcaster,
    dismissChecklist: hasBackup ? dismissConnectFarcaster : undefined,
  };
}
