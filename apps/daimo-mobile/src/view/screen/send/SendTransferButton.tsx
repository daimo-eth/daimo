import {
  EAccount,
  OpStatus,
  assert,
  canSendTo,
  dollarsToAmount,
  hasAccountName,
} from "@daimo/common";
import {
  DaimoNonce,
  DaimoNonceMetadata,
  DaimoNonceType,
  DaimoOpSender,
} from "@daimo/userop";
import { ReactNode, useEffect, useMemo } from "react";
import { ActivityIndicator } from "react-native";

import {
  transferAccountTransform,
  useSendAsync,
} from "../../../action/useSendAsync";
import { Account } from "../../../model/account";
import { AccountRecipient } from "../../../sync/recipients";
import { getAmountText } from "../../shared/Amount";
import { LongPressBigButton } from "../../shared/Button";
import { ButtonWithStatus } from "../../shared/ButtonWithStatus";
import { useExitToHome } from "../../shared/nav";
import { TextError } from "../../shared/text";
import { useWithAccount } from "../../shared/withAccount";

interface SendTransferButtonProps {
  recipient: AccountRecipient;
  dollars: number;
  requestId?: `${bigint}`;
}

export function SendTransferButton(props: SendTransferButtonProps) {
  const Inner = useWithAccount(SendTransferButtonInner);
  return <Inner {...props} />;
}

function SendTransferButtonInner({
  account,
  recipient,
  dollars,
  requestId,
}: SendTransferButtonProps & { account: Account }) {
  console.log(`[SEND] rendering SendButton ${dollars} ${requestId}`);

  // Get exact amount. No partial cents.
  assert(dollars >= 0);
  const maxDecimals = 2;
  const dollarsStr = dollars.toFixed(maxDecimals) as `${number}`;

  // Generate nonce
  const nonceMetadata = requestId
    ? new DaimoNonceMetadata(DaimoNonceType.RequestResponse, BigInt(requestId))
    : new DaimoNonceMetadata(DaimoNonceType.Send);
  const nonce = useMemo(() => new DaimoNonce(nonceMetadata), [requestId]);

  // On exec, request signature from device enclave, send transfer.
  const { status, message, cost, exec } = useSendAsync({
    dollarsToSend: dollars,
    sendFn: async (opSender: DaimoOpSender) => {
      assert(dollars > 0);
      console.log(`[ACTION] sending $${dollarsStr} to ${recipient.addr}`);
      return opSender.erc20transfer(recipient.addr, dollarsStr, {
        nonce,
        chainGasConstants: account.chainGasConstants,
      });
    },
    pendingOp: {
      type: "transfer",
      from: account.address,
      to: recipient.addr,
      amount: Number(dollarsToAmount(dollarsStr)),
      status: OpStatus.pending,
      timestamp: 0,
      nonceMetadata: nonceMetadata.toHex(),
    },
    accountTransform: transferAccountTransform(
      hasAccountName(recipient) ? [recipient as EAccount] : []
    ),
  });

  const sendDisabledReason = (function () {
    if (account.lastBalance < dollarsToAmount(cost.totalDollars)) {
      return "Insufficient funds";
    } else if (account.address === recipient.addr) {
      return "Can't send to yourself";
    } else if (!canSendTo(recipient)) {
      return "Can't send to this account";
    } else if (Number(dollarsStr) === 0) {
      return "Enter an amount";
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
            title="HOLD TO SEND"
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
        if (sendDisabledReason != null)
          return <TextError>{sendDisabledReason}</TextError>;
        if (dollars === 0) return null;
        return `Total incl. fees ${getAmountText({
          dollars: cost.totalDollars,
        })}`;
      case "loading":
        return message;
      case "error":
        return <TextError>{message}</TextError>;
      default:
        return null;
    }
  })();

  // On success, go home, show newly created transaction
  const goHome = useExitToHome();
  useEffect(() => {
    if (status !== "success") return;
    goHome();
  }, [status]);

  return <ButtonWithStatus button={button} status={statusMessage} />;
}
