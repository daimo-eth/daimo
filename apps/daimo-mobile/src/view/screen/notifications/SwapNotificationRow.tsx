import {
  getAccountName,
  getForeignCoinDisplayAmount,
  now,
  timeAgo,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import React, { useContext } from "react";
import { ActivityIndicator, View, useWindowDimensions } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";

import { NotificationRow } from "./NotificationRow";
import { DispatcherContext } from "../../../action/dispatch";
import { env } from "../../../logic/env";
import { SwapNotification } from "../../../logic/inAppNotifications";
import { Account } from "../../../model/account";
import { TokenBubble } from "../../shared/Bubble";
import Spacer from "../../shared/Spacer";
import { color, touchHighlightUnderlay } from "../../shared/style";
import { TextBody, TextMeta } from "../../shared/text";

export function SwapNotificationRow({
  notif,
  account,
}: {
  notif: SwapNotification;
  account: Account;
}) {
  // should be very rare, but we write this defensively
  const isSwapPastDeadline = notif.swap.execDeadline < now();

  const dispatcher = useContext(DispatcherContext);

  const ts = timeAgo(notif.timestamp, now(), true);

  const coin = notif.swap.fromCoin;
  const width = useWindowDimensions().width;
  const messageWidth = width - 108;

  const onPress = () => {
    if (isSwapPastDeadline) return;
    dispatcher.dispatch({
      name: "swap",
      swap: notif.swap,
    });
  };

  const accName = getAccountName(notif.swap.fromAcc);
  const chainConfig = env(daimoChainFromId(account.homeChainId)).chainConfig;
  const homeCoinName = chainConfig.tokenSymbol.toUpperCase();

  const readableAmount = getForeignCoinDisplayAmount(
    notif.swap.fromAmount,
    notif.swap.fromCoin,
  );

  const copy = (() => {
    if (notif.swap.fromCoin.token !== "ETH") {
      return (
        <TextBody color={color.grayMid} style={{ maxWidth: messageWidth }}>
          Accept {readableAmount} {coin.fullName} from{" "}
          <TextBody color={color.midnight}>{accName}</TextBody>
        </TextBody>
      );
    } else {
      return (
        <TextBody color={color.grayMid} style={{ maxWidth: messageWidth }}>
          Accept {readableAmount} {coin.fullName} as{" "}
          <TextBody color={color.midnight}>{homeCoinName}</TextBody>
        </TextBody>
      );
    }
  })();

  return (
    <TouchableHighlight onPress={onPress} {...touchHighlightUnderlay.subtle}>
      <NotificationRow>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
          <TokenBubble coin={coin} size={36} />
          <Spacer w={16} />
          <View>
            {copy}
            <Spacer h={2} />
            <TextMeta color={color.gray3}>{ts}</TextMeta>
          </View>
        </View>
        {isSwapPastDeadline ? (
          <ActivityIndicator />
        ) : (
          <View>
            <Octicons name="chevron-right" color={color.grayDark} size={32} />
          </View>
        )}
      </NotificationRow>
    </TouchableHighlight>
  );
}
