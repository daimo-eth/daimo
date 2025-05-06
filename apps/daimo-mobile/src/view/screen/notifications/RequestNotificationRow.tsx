import {
  AddrLabel,
  DaimoRequestState,
  DaimoRequestV2Status,
  EAccount,
  getAccountName,
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
import { i18NLocale, i18n } from "../../../i18n";
import { DaimoContact } from "../../../logic/daimoContacts";
import { RequestNotification } from "../../../logic/inAppNotifications";
import { Account } from "../../../storage/account";
import { ContactBubble } from "../../shared/Bubble";
import Spacer from "../../shared/Spacer";
import { TextBody, TextMeta } from "../../shared/text";
import { useTheme } from "../../style/theme";

const i18 = i18n.requestNotification;

export function RequestNotificationRow({
  notif,
  account,
}: {
  notif: RequestNotification;
  account: Account;
}) {
  const { color, touchHighlightUnderlay } = useTheme();
  const nav = useNav();

  const type =
    account.address === notif.request.recipient.addr
      ? "recipient" // we sent the request -> we're the recipient of funds
      : "expectedFulfiller"; // we're the expected fulfiller -> sender of funds

  // Hack: if request is via link, display a dummy fulfiller EAccount
  const requestLinkContact: DaimoContact = {
    type: "eAcc",
    label: AddrLabel.RequestLink,
    addr: "0x0",
  };

  const otherAcc =
    type === "expectedFulfiller"
      ? notif.request.recipient
      : notif.request.expectedFulfiller ||
        notif.request.fulfilledBy ||
        requestLinkContact;

  const ts = timeAgo(notif.timestamp, i18NLocale, now(), true);
  const dispatcher = useContext(DispatcherContext);

  const onPress =
    notif.request.status === DaimoRequestState.Created
      ? function () {
          if (type === "expectedFulfiller") {
            const { link } = notif.request;
            nav.navigate("SendTab", {
              screen: "SendTransfer",
              params: { link },
            });
          } else {
            dispatcher.dispatch({
              name: "ownRequest",
              reqStatus: notif.request,
            });
          }
        }
      : undefined;

  const width = useWindowDimensions().width;
  const messageWidth = width - 96;

  const onProfilePicTouch =
    otherAcc.label === AddrLabel.RequestLink
      ? undefined
      : () => navToAccountPage(otherAcc, nav);

  return (
    <TouchableHighlight onPress={onPress} {...touchHighlightUnderlay.subtle}>
      <NotificationRow>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={onProfilePicTouch}>
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
            {notif.request.memo && (
              <>
                <Spacer h={2} />
                <TextBody
                  color={color.grayMid}
                  style={{ maxWidth: messageWidth }}
                >
                  {notif.request.memo}
                </TextBody>
              </>
            )}
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
  const { color } = useTheme();

  const otherAccVerb =
    otherAcc.label === AddrLabel.RequestLink
      ? i18.msgVerb.via()
      : type === "recipient"
      ? i18.msgVerb.from()
      : i18.msgVerb.for();

  const otherAccText = (
    <TextBody color={color.midnight}>
      {getAccountName(otherAcc, i18NLocale)}
    </TextBody>
  );

  const dollars = (
    <TextBody color={color.midnight}>${reqStatus.link.dollars}</TextBody>
  );
  const requestStr = i18.requestState.request();
  switch (reqStatus.status) {
    case DaimoRequestState.Pending:
    case DaimoRequestState.Created:
      return type === "recipient" ? (
        // You requested...
        <>
          {i18.requestState.created.self()} {dollars} {otherAccVerb}{" "}
          {otherAccText}
        </>
      ) : (
        // ...requested $
        <>
          {otherAccText} {i18.requestState.created.other()} {dollars}
        </>
      );
    case DaimoRequestState.Fulfilled:
      return type === "recipient" ? (
        // ... fulfilled your $ request
        <>
          {otherAccText} {i18.requestState.fulfilled.self()} {dollars}{" "}
          {requestStr}
        </>
      ) : (
        // You fulfilled a request from {otherAccText} for $
        <>
          {i18.requestState.fulfilled.other()} {otherAccText}{" "}
          {i18.msgVerb.for()} {dollars}
        </>
      );
    case DaimoRequestState.Cancelled:
      return type === "recipient" ? (
        // You cancelled your $ request
        <>
          {i18.requestState.cancelled.self()} {dollars} {requestStr}{" "}
          {otherAccVerb} {otherAccText}
        </>
      ) : (
        // ...cancelled their request for $
        <>
          {otherAccText} {i18.requestState.cancelled.other()} {dollars}
        </>
      );
    case DaimoRequestState.Declined:
      return type === "recipient" ? (
        /// ...declined your request for $
        <>
          {otherAccText} {i18.requestState.declined.self()} {dollars}
        </>
      ) : (
        // You declined a request from {otherAccText} for $
        <>
          {i18.requestState.declined.other()} {otherAccText} {i18.msgVerb.for()}{" "}
          {dollars}
        </>
      );
  }
}
