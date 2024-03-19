import {
  DaimoRequestState,
  DaimoRequestV2Status,
  OpStatus,
  decodeRequestIdString,
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
import { useExitToHome } from "../../../common/nav";
import { Account } from "../../../model/account";
import { getAmountText } from "../../shared/Amount";
import { LongPressBigButton } from "../../shared/Button";
import { ButtonWithStatus } from "../../shared/ButtonWithStatus";
import { TextError } from "../../shared/text";

export function FulfillRequestButton({
  account,
  requestStatus,
}: {
  account: Account;
  requestStatus: DaimoRequestV2Status;
}) {
  const requestIdString = requestStatus.link.id;
  const dollars = Number(requestStatus.link.dollars);

  // Generate nonce
  const nonce = useMemo(
    () =>
      new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.RequestResponse)),
    []
  );

  // On exec, request signature from device enclave, approve contract, fulfill request.
  const { status, message, cost, exec } = useSendAsync({
    dollarsToSend: dollars,
    sendFn: async (opSender: DaimoOpSender) => {
      console.log(`[ACTION] fulfilling request ${requestIdString}`);
      return opSender.approveAndFulfillRequest(
        decodeRequestIdString(requestIdString),
        `${dollars}`,
        {
          nonce,
          chainGasConstants: account.chainGasConstants,
        }
      );
    },
    pendingOp: {
      type: "transfer",
      from: account.address,
      to: requestStatus.recipient.addr,
      amount: Number(dollarsToAmount(dollars)),
      status: OpStatus.pending,
      timestamp: 0,
      requestStatus: {
        ...requestStatus,
        status: DaimoRequestState.Fulfilled,
        fulfilledBy: { addr: account.address, name: account.name },
      },
    },
    accountTransform: transferAccountTransform(
      hasAccountName(requestStatus.recipient) ? [requestStatus.recipient] : [],
      requestStatus.link.id
    ),
  });

  const sendDisabledReason = (() => {
    if (requestStatus.status === DaimoRequestState.Fulfilled)
      return "Request already fulfilled";
    else if (requestStatus.status === DaimoRequestState.Cancelled)
      return "Request cancelled";
    else if (requestStatus.recipient.addr === account.address)
      return "Can't send to yourself";
    else if (account.lastBalance < dollarsToAmount(cost.totalDollars))
      return "Insufficient funds";
    else return undefined;
  })();

  const button = (function () {
    switch (status) {
      case "idle":
      case "error":
        return (
          <LongPressBigButton
            title="HOLD TO FULFILL"
            onPress={sendDisabledReason != null ? undefined : exec}
            type="primary"
            disabled={sendDisabledReason != null}
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
