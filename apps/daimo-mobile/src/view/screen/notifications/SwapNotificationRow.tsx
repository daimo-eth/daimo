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
import { i18NLocale, i18n } from "../../../i18n";
import { SwapNotification } from "../../../logic/inAppNotifications";
import { TokenBubble } from "../../shared/Bubble";
import Spacer from "../../shared/Spacer";
import { TextBody, TextMeta } from "../../shared/text";
import { useTheme } from "../../style/theme";

const i18 = i18n.swapNotification;

export function SwapNotificationRow({ notif }: { notif: SwapNotification }) {
  const { color, touchHighlightUnderlay } = useTheme();

  // should be very rare, but we write this defensively
  const isSwapPastDeadline = notif.swap.execDeadline < now();

  const dispatcher = useContext(DispatcherContext);

  const ts = timeAgo(notif.timestamp, i18NLocale, now(), true);

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

  const accName = getAccountName(notif.swap.fromAcc, i18NLocale);

  const readableAmount = getForeignCoinDisplayAmount(
    notif.swap.fromAmount,
    notif.swap.fromCoin
  );

  const copy = (() => {
    return (
      <TextBody color={color.grayMid} style={{ maxWidth: messageWidth }}>
        {i18.msg(readableAmount, coin.symbol)}
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
