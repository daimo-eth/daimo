import {
  DaimoRequestState,
  DaimoRequestV2Status,
  EAccount,
  getEAccountStr,
  now,
  timeAgo,
} from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import { useContext } from "react";
import {
  TouchableHighlight,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { NotificationRow } from "./NotificationRow";
import { DispatcherContext } from "../../../action/dispatch";
import { navToAccountPage, useNav } from "../../../common/nav";
import { RequestNotification } from "../../../logic/inAppNotifications";
import { Account } from "../../../model/account";
import { ContactBubble } from "../../shared/ContactBubble";
import Spacer from "../../shared/Spacer";
import { color, touchHighlightUnderlay } from "../../shared/style";
import { TextBody, TextMeta } from "../../shared/text";

export function RequestNotificationRow({
  notif,
  account,
}: {
  notif: RequestNotification;
  account: Account;
}) {
  const nav = useNav();

  const type =
    account.address === notif.request.recipient.addr
      ? "recipient"
      : "expectedFulfiller";
  const otherAcc =
    type === "expectedFulfiller"
      ? notif.request.recipient
      : notif.request.expectedFulfiller!;

  const ts = timeAgo(notif.timestamp, now(), true);
  const dispatcher = useContext(DispatcherContext);

  const onPress = function () {
    if (notif.request.status !== DaimoRequestState.Created) {
    } else if (type === "expectedFulfiller") {
      const { link } = notif.request;
      nav.navigate("SendTab", { screen: "SendTransfer", params: { link } });
    } else {
      dispatcher.dispatch({ name: "ownRequest", reqStatus: notif.request });
    }
  };

  const width = useWindowDimensions().width;
  const messageWidth = width - 96;

  return (
    <TouchableHighlight onPress={onPress} {...touchHighlightUnderlay.subtle}>
      <NotificationRow>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => navToAccountPage(otherAcc, nav)}>
            <ContactBubble contact={{ type: "eAcc", ...otherAcc }} size={36} />
          </TouchableOpacity>
          <Spacer w={16} />
          <View>
            <TextBody color={color.grayMid} style={{ maxWidth: messageWidth }}>
              <RequestNotificationMessage
                type={type}
                otherAcc={otherAcc}
                reqStatus={notif.request}
              />
            </TextBody>
            <Spacer h={2} />
            <TextMeta color={color.gray3}>{ts}</TextMeta>
          </View>
        </View>
        {!!onPress && (
          <View>
            <Octicons name="chevron-right" color={color.grayDark} size={32} />
          </View>
        )}
      </NotificationRow>
    </TouchableHighlight>
  );
}

function RequestNotificationMessage({
  type,
  otherAcc,
  reqStatus,
}: {
  type: "recipient" | "expectedFulfiller";
  otherAcc: EAccount;
  reqStatus: DaimoRequestV2Status;
}) {
  const otherAccText = (
    <TextBody color={color.midnight}>{getEAccountStr(otherAcc)}</TextBody>
  );

  const dollars = (
    <TextBody color={color.midnight}>${reqStatus.link.dollars}</TextBody>
  );

  switch (reqStatus.status) {
    case DaimoRequestState.Pending:
    case DaimoRequestState.Created:
      return type === "recipient" ? (
        <>
          You requested {dollars} from {otherAccText}
        </>
      ) : (
        <>
          {otherAccText} requested {dollars}
        </>
      );
    case DaimoRequestState.Fulfilled:
      return type === "recipient" ? (
        <>
          {otherAccText} fulfilled your {dollars} request
        </>
      ) : (
        <>
          You fulfilled {otherAccText}'s {dollars} request
        </>
      );
    case DaimoRequestState.Cancelled:
      return type === "recipient" ? (
        <>
          You cancelled your {dollars} request for {otherAccText}
        </>
      ) : (
        <>
          {otherAccText} cancelled their {dollars} request
        </>
      );
    case DaimoRequestState.Declined:
      return type === "recipient" ? (
        <>
          {otherAccText} declined your {dollars} request
        </>
      ) : (
        <>
          You declined {otherAccText}'s {dollars} request
        </>
      );
  }
}
