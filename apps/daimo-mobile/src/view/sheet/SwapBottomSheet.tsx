import {
  ForeignCoin,
  OpStatus,
  ProposedSwap,
  amountToDollars,
  daimoUSDC,
  getForeignCoinDisplayAmount,
  hasAccountName,
  now,
} from "@daimo/common";
import { DaimoNonce, DaimoNonceMetadata, DaimoNonceType } from "@daimo/userop";
import { useContext, useEffect, useMemo } from "react";
import { ActivityIndicator, View, Image } from "react-native";

import SwapLink from "../../../assets/swap-link.png";
import { DispatcherContext } from "../../action/dispatch";
import {
  transferAccountTransform,
  useSendWithDeviceKeyAsync,
} from "../../action/useSendAsync";
import { navToAccountPage, useNav } from "../../common/nav";
import { useAccount } from "../../logic/accountManager";
import { AccountRow } from "../shared/AccountRow";
import { TitleAmount } from "../shared/Amount";
import { TokenBubble } from "../shared/Bubble";
import { ButtonMed } from "../shared/Button";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { color, ss } from "../shared/style";
import { TextBodyCaps, TextH3 } from "../shared/text";

// Bottom sheet for proposed swap
export function SwapBottomSheet({ swap }: { swap: ProposedSwap }) {
  const account = useAccount();
  const nav = useNav();
  const dispatcher = useContext(DispatcherContext);

  // Generate nonce
  const nonce = useMemo(
    () => new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.Swap)),
    []
  );

  const { status, exec: onCancel } = useSendWithDeviceKeyAsync({
    dollarsToSend: 0,
    sendFn: async (opSender) => {
      console.log(`[ACTION] executing swap ${swap.fromCoin.fullName}`);
      return opSender.executeProposedSwap(swap, {
        nonce,
        chainGasConstants: account!.chainGasConstants,
      });
    },
    pendingOp: {
      type: "transfer",
      from: swap.fromAcc.addr,
      to: account!.address,
      amount: swap.toAmount,
      preSwapTransfer: {
        coin: swap.fromCoin,
        from: swap.fromAcc.addr,
        amount: swap.fromAmount,
      },
      status: OpStatus.pending,
      timestamp: now(),
    },
    accountTransform: transferAccountTransform(
      swap.fromAcc && hasAccountName(swap.fromAcc) ? [swap.fromAcc] : []
    ),
  });

  useEffect(() => {
    if (status === "success") {
      dispatcher.dispatch({ name: "hideBottomSheet" });
      nav.navigate("HomeTab", { screen: "Home" });
    }
  }, [status]);

  if (!account) return null;

  return (
    <View style={ss.container.padH16}>
      <ScreenHeader
        title="Accept"
        onExit={() => {
          dispatcher.dispatch({ name: "hideBottomSheet" });
        }}
        hideOfflineHeader
      />
      <Spacer h={16} />
      <TitleAmount
        amount={BigInt(swap.toAmount)}
        preSymbol="+"
        postText="USDC"
      />
      {swap.fromCoin.token !== "ETH" && (
        <>
          <Spacer h={32} />
          <AccountRow
            acc={swap.fromAcc}
            timestamp={swap.receivedAt}
            viewAccount={() => navToAccountPage(swap.fromAcc!, nav)}
          />
        </>
      )}
      <Spacer h={32} />
      <SwapInfoRow swap={swap} />
      <Spacer h={32} />
      {status === "idle" && (
        <ButtonMed
          title="ACCEPT"
          onPress={onCancel}
          type="primary"
          showBiometricIcon
        />
      )}
      {status === "loading" && <ActivityIndicator size="large" />}
      <Spacer h={48} />
    </View>
  );
}

function SwapInfoRow({ swap }: { swap: ProposedSwap }) {
  const humanReadableFromAmount = getForeignCoinDisplayAmount(
    swap.fromAmount,
    swap.fromCoin
  );

  const humanReadableToAmount = `$${amountToDollars(swap.toAmount)}`;

  return (
    <View style={{ flexDirection: "column", alignItems: "center" }}>
      <View>
        <CurrencyDisplay
          coin={swap.fromCoin}
          amount={humanReadableFromAmount}
        />
        <Image source={SwapLink} />
        <CurrencyDisplay
          coin={daimoUSDC}
          amount={humanReadableToAmount}
          amountColor={color.successDark}
        />
      </View>
    </View>
  );
}

function CurrencyDisplay({
  coin,
  amount,
  amountColor,
}: {
  coin: ForeignCoin;
  amount: string;
  amountColor?: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "flex-start",
      }}
    >
      <TokenBubble coin={coin} size={48} />
      <Spacer w={8} />
      <View style={{ flexDirection: "column" }}>
        <TextH3 color={color.midnight}>{coin.fullName}</TextH3>
        <Spacer h={2} />
        <TextBodyCaps color={amountColor || color.grayDark}>
          {amount} {coin.symbol}
        </TextBodyCaps>
      </View>
    </View>
  );
}
