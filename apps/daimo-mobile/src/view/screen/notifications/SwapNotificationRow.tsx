import {
  getAccountName,
  getForeignCoinDisplayAmount,
  now,
  timeAgo,
} from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import React, { useContext } from "react";
import { ActivityIndicator, View, useWindowDimensions } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";

import { NotificationRow } from "./NotificationRow";
import { DispatcherContext } from "../../../action/dispatch";
import { getI18NLocale, i18n } from "../../../i18n";
import { SwapNotification } from "../../../logic/inAppNotifications";
import { Account } from "../../../storage/account";
import { TokenBubble } from "../../shared/Bubble";
import Spacer from "../../shared/Spacer";
import { color, touchHighlightUnderlay } from "../../shared/style";
import { TextBody, TextMeta } from "../../shared/text";

const i18 = i18n.swapNotification;

export function SwapNotificationRow({
  notif,
  account,
}: {
  notif: SwapNotification;
  account: Account;
}) {
  const locale = getI18NLocale();
  // should be very rare, but we write this defensively
  const isSwapPastDeadline = notif.swap.execDeadline < now();

  const dispatcher = useContext(DispatcherContext);

  const ts = timeAgo(notif.timestamp, locale, now(), true);

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

  const accName = getAccountName(notif.swap.fromAcc, locale);

  const readableAmount = getForeignCoinDisplayAmount(
    notif.swap.fromAmount,
    notif.swap.fromCoin
  );

  const copy = (() => {
    return (
      <TextBody color={color.grayMid} style={{ maxWidth: messageWidth }}>
        {i18.msg(readableAmount, coin.name)}
        <TextBody color={color.midnight}>{accName}</TextBody>
      </TextBody>
    );
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
