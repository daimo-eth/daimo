import { OffchainAction, now, zDollarStr } from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { stringToBytes } from "viem";

import { signAsync } from "./sign";
import { ActHandle, useActStatus } from "../action/actStatus";
import { i18n } from "../i18n";
import { getRpcFunc } from "../logic/trpc";
import { Account } from "../storage/account";

const i18 = i18n.landlineDepositButton;

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
    console.log(
      `[LANDLINE] Creating deposit for ${account.name} to ${recipient.landlineAccountUuid} for $${dollarsStr}`
    );
    setAS("loading", i18.depositStatus.creating());

    // Make the user sign an offchain action to authenticate the deposit
    const action: OffchainAction = {
      type: "landlineDeposit",
      time: now(),
      landlineAccountUuid: recipient.landlineAccountUuid,
      amount: zDollarStr.parse(dollarsStr),
      memo: memo ?? "",
    };
    const actionJSON = JSON.stringify(action);
    const messageBytes = stringToBytes(actionJSON);
    const signature = await signAsync({ account, messageBytes });

    try {
      const rpcFunc = getRpcFunc(daimoChainFromId(account.homeChainId));
      console.log("[LANDLINE] Making RPC call to depositFromLandline");
      const response = await rpcFunc.depositFromLandline.mutate({
        daimoAddress: account.address,
        actionJSON,
        signature,
      });

      if (response.status === "success") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setAS("success", i18.depositStatus.success());
      } else {
        console.error("[LANDLINE] Landline deposit error:", response.error);
        setAS("error", i18.depositStatus.failed());
      }
    } catch (error) {
      console.error("[LANDLINE] Landline deposit error:", error);
      setAS("error", i18.depositStatus.failed());
    }
  }, [account, recipient, dollarsStr, memo, setAS]);

  return { ...as, exec };
}
