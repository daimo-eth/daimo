import {
  EAccount,
  ForeignToken,
  OpStatus,
  ProposedSwap,
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
  useSendWithDeviceKeyAsync,
} from "../../../action/useSendAsync";
import { useExitToHome } from "../../../common/nav";
import {
  BridgeBankAccountContact,
  EAccountContact,
} from "../../../logic/daimoContacts";
import { Account } from "../../../storage/account";
import { getAmountText } from "../../shared/Amount";
import { LongPressBigButton } from "../../shared/Button";
import { ButtonWithStatus } from "../../shared/ButtonWithStatus";
import { TextError } from "../../shared/text";

export function SendTransferButton({
  account,
  recipient,
  dollars,
  toCoin,
  memo,
  minTransferAmount = 0,
  route,
}: {
  account: Account;
  recipient: EAccountContact | BridgeBankAccountContact;
  dollars: number;
  toCoin: ForeignToken;
  memo?: string;
  minTransferAmount?: number;
  route?: ProposedSwap | null;
}) {
  console.log(`[SEND] rendering SendButton ${dollars}`);

  // Get exact amount. No partial cents.
  assert(dollars >= 0);
  const maxDecimals = 2;
  const dollarsStr = dollars.toFixed(maxDecimals) as `${number}`;

  // Generate nonce
  const nonce = useMemo(
    () => new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.Send)),
    []
  );

  // Note whether the transfer has a swap or not for op creation.
  const isSwap = !!(route && route.routeFound);
  const pendingOpBase = {
    from: account.address,
    to: recipient.addr,
    amount: Number(dollarsToAmount(dollarsStr)),
    memo,
    status: OpStatus.pending,
    timestamp: 0,
  };

  // On exec, request signature from device enclave, send transfer.
  const { status, message, cost, exec } = useSendWithDeviceKeyAsync({
    dollarsToSend: dollars,
    sendFn: async (opSender: DaimoOpSender) => {
      assert(dollars > 0);
      console.log(
        `[ACTION] sending $${dollarsStr} ${toCoin.symbol} to ${recipient.addr}`
      );
      const opMetadata = {
        nonce,
        chainGasConstants: account.chainGasConstants,
      };

      // Swap and transfer if outbound coin is different than home coin.
      if (isSwap) {
        console.log(`[ACTION] sending via swap with route ${route}`);
        return opSender.executeProposedSwap(route, opMetadata);
      }
      // Otherwise, just send home coin directly.
      return opSender.erc20transfer(
        recipient.addr,
        dollarsStr,
        opMetadata,
        memo
      );
    },
    pendingOp: { type: "transfer", ...pendingOpBase },
    // TODO: outbound swap, postSwapTransfer
    // pendingOp: isSwap
    //   ? {
    //       type: "outboundSwap",
    //       ...pendingOpBase,
    //       coinOther: toCoin,
    //       amountOther: `${route.toAmount}` as BigIntStr,
    //     }
    //   : {
    //       type: "transfer",
    //       ...pendingOpBase,
    //     },
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
    } else if (Number(dollarsStr) < minTransferAmount) {
      return `Minimum transfer amount is ${minTransferAmount} USDC`;
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
      case "idle": {
        const totalStr = getAmountText({ dollars: cost.totalDollars });
        const hasFee = cost.feeDollars > 0;
        if (sendDisabledReason === "Insufficient funds" && hasFee) {
          return <TextError>You need at least {totalStr} to send</TextError>;
        } else if (sendDisabledReason === "Insufficient funds") {
          return <TextError>Insufficient funds</TextError>;
        } else if (sendDisabledReason != null) {
          return <TextError>{sendDisabledReason}</TextError>;
        } else if (hasFee) {
          return `Total with fees ${totalStr}`;
        } else {
          return "Payments are public";
        }
      }
      case "loading": {
        return message;
      }
      case "error": {
        return <TextError>{message}</TextError>;
      }
      default: {
        return null;
      }
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
