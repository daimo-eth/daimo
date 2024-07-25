import { assert } from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import * as Haptics from "expo-haptics";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";

import { useExitToHome } from "../../../common/nav";
import { LandlineBankAccountContact } from "../../../logic/daimoContacts";
import { getRpcFunc } from "../../../logic/trpc";
import { Account } from "../../../storage/account";
import { LongPressBigButton } from "../../shared/Button";
import { ButtonWithStatus } from "../../shared/ButtonWithStatus";
import { TextError } from "../../shared/text";

export function LandlineDepositButton({
  account,
  recipient,
  dollars,
  memo,
  minTransferAmount = 0,
}: {
  account: Account;
  recipient: LandlineBankAccountContact;
  dollars: number;
  memo?: string;
  minTransferAmount?: number;
}) {
  console.log(`[SEND] rendering LandlineDepositButton ${dollars}`);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  // Get exact amount. No partial cents.
  assert(dollars >= 0);
  const maxDecimals = 2;
  const dollarsStr = dollars.toFixed(maxDecimals) as `${number}`;

  const sendDisabledReason = (function () {
    if (account.lastBalance < Number(dollarsStr)) {
      return "Insufficient funds";
    } else if (account.address === recipient.addr) {
      return "Can't send to yourself";
    } else if (Number(dollarsStr) === 0) {
      return "Enter an amount";
    } else if (Number(dollarsStr) < minTransferAmount) {
      return `Minimum transfer amount is ${minTransferAmount} USDC`;
    } else {
      return undefined;
    }
  })();
  const disabled = sendDisabledReason != null || dollars === 0;

  // TODO: authenticate this call
  const handlePress = useCallback(async () => {
    const rpcFunc = getRpcFunc(daimoChainFromId(account.homeChainId));
    const response = await rpcFunc.depositFromLandline.mutate({
      daimoAddress: account.address,
      landlineAccountUuid: recipient.landlineAccountUuid,
      amount: dollarsStr,
      memo,
    });
    if (response.status === "success") {
      // Vibrate on success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStatus("success");
    } else {
      setStatus("error");
    }
  }, [account.address, dollarsStr, memo, recipient.landlineAccountUuid]);

  const button = (function () {
    switch (status) {
      case "idle":
      case "error":
        return (
          <LongPressBigButton
            title="HOLD TO DEPOSIT"
            onPress={disabled ? undefined : handlePress}
            type="primary"
            disabled={disabled}
            duration={400}
            showBiometricIcon
          />
        );
      case "loading":
        return <ActivityIndicator size="large" />;
      case "success":
        return null;
    }
  })();

  const statusMessage = (function (): ReactNode {
    if (sendDisabledReason === "Insufficient funds") {
      return <TextError>Insufficient funds</TextError>;
    } else if (sendDisabledReason != null) {
      return <TextError>{sendDisabledReason}</TextError>;
    } else {
      return null;
    }
  })();

  // On success, go home
  // TODO: show notification
  const goHome = useExitToHome();
  useEffect(() => {
    if (status !== "success") return;
    goHome();
  }, [status]);

  return <ButtonWithStatus button={button} status={statusMessage} />;
}
