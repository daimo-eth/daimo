import { assert } from "@daimo/common";
import { ReactNode, useEffect } from "react";
import { ActivityIndicator } from "react-native";

import { useLandlineDeposit } from "../../../action/useLandlineDeposit";
import { useExitToHome } from "../../../common/nav";
import { i18n } from "../../../i18n";
import { LandlineBankAccountContact } from "../../../logic/daimoContacts";
import { Account } from "../../../storage/account";
import { LongPressBigButton } from "../../shared/Button";
import { ButtonWithStatus } from "../../shared/ButtonWithStatus";
import { TextColor, TextError } from "../../shared/text";
import { useTheme } from "../../style/theme";

const i18 = i18n.landlineDepositButton;

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
  const { color } = useTheme();
  console.log(`[SEND] rendering LandlineDepositButton ${dollars}`);

  // Get exact amount. No partial cents.
  assert(dollars >= 0);
  const maxDecimals = 2;
  const dollarsStr = dollars.toFixed(maxDecimals) as `${number}`;

  const { status, message, exec } = useLandlineDeposit({
    account,
    recipient,
    dollarsStr,
    memo,
  });

  const sendDisabledReason = (function () {
    if (account.lastBalance < Number(dollarsStr)) {
      return i18n.sendTransferButton.disabledReason.insufficientFunds();
    } else if (account.address === recipient.addr) {
      return i18n.sendTransferButton.disabledReason.self();
    } else if (Number(dollarsStr) === 0) {
      return i18n.sendTransferButton.disabledReason.zero();
    } else if (Number(dollarsStr) < minTransferAmount) {
      return i18n.sendTransferButton.disabledReason.min(minTransferAmount);
    } else {
      return undefined;
    }
  })();
  const disabled = sendDisabledReason != null || dollars === 0;

  const button = (function () {
    switch (status) {
      case "idle":
      case "error":
        return (
          <LongPressBigButton
            title={i18.holdButton()}
            onPress={disabled ? undefined : exec}
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
    switch (status) {
      case "idle":
        if (sendDisabledReason === "Insufficient funds") {
          return <TextError>Insufficient funds</TextError>;
        } else if (sendDisabledReason != null) {
          return <TextError>{sendDisabledReason}</TextError>;
        } else {
          return null;
        }
      case "error":
        return <TextError>{message}</TextError>;
      case "loading":
        return message;
      case "success":
        return <TextColor color={color.success}>{message}</TextColor>;
      default:
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
