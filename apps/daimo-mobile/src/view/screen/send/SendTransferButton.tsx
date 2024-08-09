import {
  DAv2Chain,
  EAccount,
  ForeignToken,
  OpStatus,
  ProposedSwap,
  assert,
  base,
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
import { i18n } from "../../../i18n";
import {
  BridgeBankAccountContact,
  EAccountContact,
} from "../../../logic/daimoContacts";
import { Account } from "../../../storage/account";
import { getAmountText } from "../../shared/Amount";
import { LongPressBigButton } from "../../shared/Button";
import { ButtonWithStatus } from "../../shared/ButtonWithStatus";
import { TextError } from "../../shared/text";

const i18 = i18n.sendTransferButton;

export function SendTransferButton({
  account,
  recipient,
  dollars,
  toCoin,
  toChain,
  memo,
  minTransferAmount = 0,
  route,
}: {
  account: Account;
  recipient: EAccountContact | BridgeBankAccountContact;
  dollars: number;
  toCoin: ForeignToken;
  toChain: DAv2Chain;
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

      // TODO: handle case with swap and bridge
      // TODO: check against home chain instead of hardcoding base
      if (toChain.chainId !== base.chainId) {
        console.log(`[ACTION] sending via FastCCTP to chain ${toChain.name}`);
        return opSender.sendUsdcToOtherChain(
          recipient.addr,
          toChain,
          dollarsStr,
          opMetadata,
          memo
        );
      } else if (isSwap) {
        // Swap and transfer if outbound coin is different than home coin.
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

  const insufficientFundsStr = i18.disabledReason.insufficientFunds();
  const sendDisabledReason = (function () {
    if (account.lastBalance < dollarsToAmount(cost.totalDollars)) {
      return insufficientFundsStr;
    } else if (account.address === recipient.addr) {
      return i18.disabledReason.self();
    } else if (!canSendTo(recipient)) {
      return i18.disabledReason.other();
    } else if (Number(dollarsStr) === 0) {
      return i18.disabledReason.zero();
    } else if (Number(dollarsStr) < minTransferAmount) {
      return i18.disabledReason.min(minTransferAmount);
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
      case "idle": {
        const totalStr = getAmountText({ dollars: cost.totalDollars });
        const hasFee = cost.feeDollars > 0;
        if (sendDisabledReason === insufficientFundsStr && hasFee) {
          return (
            <TextError>
              {i18.statusMsg.insufficientFundsPlusFee(totalStr)}
            </TextError>
          );
        } else if (sendDisabledReason === insufficientFundsStr) {
          return <TextError>{insufficientFundsStr}</TextError>;
        } else if (sendDisabledReason != null) {
          return <TextError>{sendDisabledReason}</TextError>;
        } else if (hasFee) {
          return i18.statusMsg.totalDollars(totalStr);
        } else {
          return i18.statusMsg.paymentsPublic();
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
