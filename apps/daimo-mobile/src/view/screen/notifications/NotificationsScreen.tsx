import { ProposedSwap } from "@daimo/common";
import { useEffect } from "react";
import { ScrollView, View } from "react-native";

import { InvitesNotificationRow } from "./InvitesNotificationRow";
import { NotificationRow } from "./NotificationRow";
import { RequestNotificationRow } from "./RequestNotificationRow";
import { SwapNotificationRow } from "./SwapNotificationRow";
import { useNav } from "../../../common/nav";
import { i18n } from "../../../i18n";
import { useInAppNotifications } from "../../../logic/inAppNotifications";
import { Account } from "../../../storage/account";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import { TextCenter, TextH3 } from "../../shared/text";
import { useWithAccount } from "../../shared/withAccount";
import { useTheme } from "../../style/theme";

const i18 = i18n.notifications;

// In-app notifications screen.
export function NotificationsScreen() {
  const Inner = useWithAccount(NotificationsScreenInner);
  return <Inner />;
}

function NotificationsScreenInner({ account }: { account: Account }) {
  const nav = useNav();
  const { color, ss } = useTheme();

  const { unread, notifications, markRead } = useInAppNotifications();

  useEffect(() => {
    if (unread) markRead();
  }, [unread]);

  const swapNotifKey = (swap: ProposedSwap) => {
    return `${swap.fromCoin.token}-${swap.fromAmount}-${swap.toAmount}-${swap.receivedAt}`;
  };

  return (
    <View style={ss.container.screenWithoutPadding}>
      <View style={ss.container.padH16}>
        <ScreenHeader title={i18.screenHeader()} onBack={nav.goBack} />
        {notifications.length === 0 && (
          <>
            <Spacer h={64} />
            <TextCenter>
              <TextH3 color={color.gray3}>{i18.noNotifications()}</TextH3>
            </TextCenter>
          </>
        )}
      </View>
      <ScrollView>
        {notifications.map((notif) => {
          switch (notif.type) {
            case "request":
              return (
                <RequestNotificationRow
                  key={notif.request.link.id}
                  notif={notif}
                  account={account}
                />
              );
            case "invite":
              return <InvitesNotificationRow key="invite" notif={notif} />;
            case "swap":
              return (
                <SwapNotificationRow
                  key={swapNotifKey(notif.swap)}
                  notif={notif}
                />
              );
          }
        })}
        {notifications.length > 0 && <NotificationRow children={null} />}
      </ScrollView>
    </View>
  );
}
