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
  useSendWithDeviceKeyAsync,
} from "../../../action/useSendAsync";
import { useExitToHome } from "../../../common/nav";
import { useI18n } from "../../../logic/i18n";
import { Account } from "../../../storage/account";
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
  const i18n = useI18n().fulfillRequest;
  const requestIdString = requestStatus.link.id;
  const dollars = Number(requestStatus.link.dollars);

  // Generate nonce
  const nonce = useMemo(
    () =>
      new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.RequestResponse)),
    []
  );

  // On exec, request signature from device enclave, approve contract, fulfill request.
  const { status, message, cost, exec } = useSendWithDeviceKeyAsync({
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
      hasAccountName(requestStatus.recipient) ? [requestStatus.recipient] : []
    ),
  });

  const sendDisabledReason = (() => {
    if (requestStatus.status === DaimoRequestState.Fulfilled)
      return i18n.disabledReason.fulfilled();
    else if (requestStatus.status === DaimoRequestState.Cancelled)
      return i18n.disabledReason.cancelled();
    else if (requestStatus.recipient.addr === account.address)
      return i18n.disabledReason.self();
    else if (account.lastBalance < dollarsToAmount(cost.totalDollars))
      return i18n.disabledReason.insufficientFunds();
    else return undefined;
  })();

  const button = (function () {
    switch (status) {
      case "idle":
      case "error":
        return (
          <LongPressBigButton
            title={i18n.holdButton()}
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
        if (dollars === 0) return i18n.statusMsg.paymentsPublic();
        return i18n.statusMsg.totalDollars({
          dollars: getAmountText({
            dollars: cost.totalDollars,
          }),
        });
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
