import {
  assert,
  canSendTo,
  dollarsToAmount,
  EAccount,
  getFullMemo,
  hasAccountName,
  MoneyEntry,
  OpStatus,
  ProposedSwap,
  TransferSwapClog,
} from "@daimo/common";
import { ForeignToken, getDAv2Chain } from "@daimo/contract";
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
  EAccountContact,
  LandlineBankAccountContact,
} from "../../../logic/daimoContacts";
import { Account, getHomeCoin } from "../../../storage/account";
import { getAmountText } from "../../shared/Amount";
import { LongPressBigButton } from "../../shared/Button";
import { ButtonWithStatus } from "../../shared/ButtonWithStatus";
import { TextError } from "../../shared/text";

const i18 = i18n.sendTransferButton;

export function SendTransferButton({
  account,
  recipient,
  money,
  toCoin,
  memo,
  minTransferAmount = 0,
  route,
  onSuccess,
}: {
  account: Account;
  recipient: EAccountContact | LandlineBankAccountContact;
  money: MoneyEntry;
  toCoin: ForeignToken;
  memo?: string;
  minTransferAmount?: number;
  route?: ProposedSwap | null;
  onSuccess?: () => void;
}) {
  // Get exact amount. No partial cents.
  const { dollars } = money;
  const maxDecimals = 2;
  const dollarsStr = dollars.toFixed(maxDecimals) as `${number}`;
  assert(dollarsStr !== "0.00", "Can't send $0.00");

  // Generate nonce
  const nonce = useMemo(
    () => new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.Send)),
    []
  );

  // Note whether the transfer has a swap or not for op creation.
  const homeCoin = getHomeCoin(account);
  const isBridge = toCoin.chainId !== homeCoin.chainId;
  const toChain = getDAv2Chain(toCoin.chainId);
  const isSwap = toChain.bridgeCoin.token !== toCoin.token;
  // TODO: handle case with swap and bridge
  assert(!(isSwap && isBridge), "swap+bridge unsupported");

  const fullMemo = getFullMemo({ memo, money });

  // Pending swap, appears immediately > replaced by onchain data
  const pendingOp: TransferSwapClog = {
    type: "transfer",
    from: account.address,
    to: recipient.addr,
    amount: Number(dollarsToAmount(dollarsStr)),
    memo: fullMemo,
    status: OpStatus.pending,
    timestamp: 0,
  };
  if (isSwap || isBridge) {
    pendingOp.postSwapTransfer = {
      amount: `${BigInt(route?.toAmount || pendingOp.amount)}`,
      to: recipient.addr,
      coin: toCoin,
    };
  }

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

      if (isBridge) {
        const toChain = getDAv2Chain(toCoin.chainId);
        console.log(`[ACTION] sending via FastCCTP to chain ${toChain.name}`);
        return opSender.sendUsdcToOtherChain(
          recipient.addr,
          toChain,
          dollarsStr,
          opMetadata,
          memo
        );
      } else if (isSwap) {
        if (route == null) {
          throw new Error("missing swap route");
        }
        // Swap and transfer if outbound coin is different than home coin.
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
    pendingOp,
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
    if (onSuccess) {
      onSuccess();
    } else {
      goHome();
    }
  }, [status, onSuccess, goHome]);

  return <ButtonWithStatus button={button} status={statusMessage} />;
}
