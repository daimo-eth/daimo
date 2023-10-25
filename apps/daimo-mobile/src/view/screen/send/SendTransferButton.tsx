import {
  EAccount,
  OpStatus,
  assert,
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
import { Recipient } from "../../../sync/recipients";
import { getAmountText } from "../../shared/Amount";
import { ButtonBig } from "../../shared/Button";
import { ButtonWithStatus } from "../../shared/ButtonWithStatus";
import { navResetToHome, useNav } from "../../shared/nav";
import { TextError } from "../../shared/text";
import { withAccount } from "../../shared/withAccount";

interface SendTransferButtonProps {
  recipient: Recipient;
  dollars: number;
  requestId?: `${bigint}`;
}

export function SendTransferButton(props: SendTransferButtonProps) {
  const Inner = withAccount(SendTransferButtonInner);
  return <Inner {...props} />;
}

function SendTransferButtonInner({
  account,
  recipient,
  dollars,
  requestId,
}: SendTransferButtonProps & { account: Account }) {
  console.log(`[SEND] rendering SendButton ${dollars} ${requestId}`);
  assert(dollars >= 0);

  const nonceMetadata = requestId
    ? new DaimoNonceMetadata(DaimoNonceType.RequestResponse, BigInt(requestId))
    : new DaimoNonceMetadata(DaimoNonceType.Send);

  const nonce = useMemo(() => new DaimoNonce(nonceMetadata), [requestId]);

  const { status, message, cost, exec } = useSendAsync({
    dollarsToSend: dollars,
    sendFn: async (opSender: DaimoOpSender) => {
      assert(dollars > 0);
      console.log(`[ACTION] sending $${dollars} to ${recipient.addr}`);
      return opSender.erc20transfer(recipient.addr, `${dollars}`, {
        nonce,
        chainGasConstants: account.chainGasConstants,
      });
    },
    pendingOp: {
      type: "transfer",
      from: account.address,
      to: recipient.addr,
      amount: Number(dollarsToAmount(dollars)),
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
          <ButtonBig
            title="CONFIRM AND SEND"
            onPress={disabled ? undefined : exec}
            type="primary"
            disabled={disabled}
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
  const nav = useNav();
  useEffect(() => {
    if (status !== "success") return;
    navResetToHome(nav);
  }, [status]);

  return <ButtonWithStatus button={button} status={statusMessage} />;
}
