import {
  assert,
  dollarsToAmount,
  OpStatus,
  EAccount,
  getAccountName,
} from "@daimo/common";
import {
  DaimoNonceMetadata,
  DaimoNonceType,
  DaimoNonce,
  DaimoOpSender,
} from "@daimo/userop";
import { useMemo, ReactNode, useEffect } from "react";
import { ActivityIndicator } from "react-native";

import { useSendAsync } from "../../../action/useSendAsync";
import { useAccount } from "../../../model/account";
import { Recipient } from "../../../sync/recipients";
import { getAmountText } from "../../shared/Amount";
import { ButtonBig } from "../../shared/Button";
import { ButtonWithStatus } from "../../shared/ButtonWithStatus";
import { useNav } from "../../shared/nav";
import { TextError } from "../../shared/text";

export function SendTransferButton({
  recipient,
  dollars,
  requestId,
}: {
  recipient: Recipient;
  dollars: number;
  requestId?: `${bigint}`;
}) {
  console.log(`[SEND] rendering SendButton ${dollars} ${requestId}`);
  const [account] = useAccount();
  assert(account != null);
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
    namedAccounts: recipient.name ? [recipient as EAccount] : [],
  });

  const sendDisabledReason =
    account.lastBalance < dollarsToAmount(cost.totalDollars)
      ? "Insufficient funds"
      : undefined;
  const disabled = sendDisabledReason != null || dollars === 0;

  const button = (function () {
    switch (status) {
      case "idle":
      case "error":
        return (
          <ButtonBig
            title={`Send to ${getAccountName(recipient)}`}
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
    nav.navigate("Home");
  }, [status]);

  return <ButtonWithStatus button={button} status={statusMessage} />;
}
