import { useCallback, useContext, useMemo } from "react";

import { DispatcherContext } from "../action/dispatch";
import { useNav } from "../common/nav";
import { Account } from "../model/account";

export function useOnboardingChecklist(account: Account) {
  const nav = useNav();
  const dispatcher = useContext(DispatcherContext);

  const hasBackup = useMemo(() => {
    return account.accountKeys.length > 1;
  }, [account.accountKeys.length]);

  const farcasterConnected = useMemo(() => {
    return account.linkedAccounts.length > 0;
  }, [account.linkedAccounts.length]);

  const allComplete = useMemo(() => {
    return hasBackup && farcasterConnected;
  }, [hasBackup, farcasterConnected]);

  const handleSecureAccount = useCallback(() => {
    nav.navigate("Settings");
    dispatcher.dispatch({ name: "hideBottomSheet" });
  }, [nav, dispatcher]);

  const handleConnectFarcaster = useCallback(() => {
    nav.navigate("Settings");
    dispatcher.dispatch({ name: "connectFarcaster" });
  }, [nav, dispatcher]);

  const dismissSheet = useCallback(() => {
    dispatcher.dispatch({ name: "hideBottomSheet" });
  }, [dispatcher]);

  return {
    hasBackup,
    farcasterConnected,
    allComplete,
    handleSecureAccount,
    handleConnectFarcaster,
    dismissSheet,
  };
}
