import { daimoChainFromId } from "@daimo/contract";
import * as Haptics from "expo-haptics";
import { useCallback } from "react";

import { ActHandle, useActStatus } from "../action/actStatus";
import { getRpcFunc } from "../logic/trpc";
import { Account } from "../storage/account";

interface UseLandlineDepositArgs {
  account: Account;
  recipient: { landlineAccountUuid: string };
  dollarsStr: string;
  memo?: string;
}

export function useLandlineDeposit({
  account,
  recipient,
  dollarsStr,
  memo,
}: UseLandlineDepositArgs): ActHandle & { exec: () => Promise<void> } {
  const [as, setAS] = useActStatus("useLandlineDeposit");

  const exec = useCallback(async () => {
    setAS("loading", "Creating deposit");
    try {
      // TODO: authenticate call to the deposit RPC function
      const rpcFunc = getRpcFunc(daimoChainFromId(account.homeChainId));
      const response = await rpcFunc.depositFromLandline.mutate({
        daimoAddress: account.address,
        landlineAccountUuid: recipient.landlineAccountUuid,
        amount: dollarsStr,
        memo,
      });

      if (response.status === "success") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setAS("success", "Deposit successful!");
      } else {
        setAS("error", "Deposit failed");
      }
    } catch (error) {
      console.error("Landline deposit error:", error);
      setAS("error", "An error occurred during deposit");
    }
  }, [account, recipient, dollarsStr, memo, setAS]);

  return { ...as, exec };
}
