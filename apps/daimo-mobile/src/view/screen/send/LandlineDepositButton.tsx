import { assert } from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import { ReactNode, useEffect, useState } from "react";

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
  const [depositSuccess, setDepositSuccess] = useState(false);

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
  const handlePress = () => {
    const rpcFunc = getRpcFunc(daimoChainFromId(account.homeChainId));
    const response = rpcFunc.depositFromLandline.mutate({
      daimoAddress: account.address,
      landlineAccountUuid: recipient.landlineAccountUuid,
      amount: dollarsStr,
      memo,
    });
    if (response.status === "success") {
      setDepositSuccess(true);
    }
  };

  const button = (function () {
    return (
      <LongPressBigButton
        title="HOLD TO SEND"
        onPress={disabled ? undefined : handlePress}
        type="primary"
        disabled={disabled}
        duration={400}
        showBiometricIcon
      />
    );
  })();

  const statusMessage = (function (): ReactNode {
    if (sendDisabledReason === "Insufficient funds") {
      return <TextError>Insufficient funds</TextError>;
    } else if (sendDisabledReason != null) {
      return <TextError>{sendDisabledReason}</TextError>;
    } else {
      return "Payments are public";
    }
  })();

  // On success, go home, show newly created transaction
  const goHome = useExitToHome();
  useEffect(() => {
    if (!depositSuccess) return;
    goHome();
  }, [depositSuccess]);

  return <ButtonWithStatus button={button} status={statusMessage} />;
}
