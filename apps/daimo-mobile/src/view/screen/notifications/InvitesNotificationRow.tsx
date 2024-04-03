import Octicons from "@expo/vector-icons/Octicons";
import { View } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";

import { NotificationRow } from "./NotificationRow";
import { useNav } from "../../../common/nav";
import { InvitesNotification } from "../../../logic/inAppNotifications";
import { color, touchHighlightUnderlay } from "../../shared/style";
import { TextBody } from "../../shared/text";

export function InvitesNotificationRow({
  notif,
}: {
  notif: InvitesNotification;
}) {
  const nav = useNav();

  const inviteCount = notif.inviteLinkStatus.usesLeft || 0;

  return (
    <TouchableHighlight
      onPress={() => nav.navigate("InviteTab", { screen: "Invite" })}
      {...touchHighlightUnderlay.subtle}
    >
      <NotificationRow>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
          <View style={{ paddingLeft: 7, paddingRight: 21 }}>
            <TextBody>✨</TextBody>
          </View>
          <TextBody color={color.midnight}>
            You have {inviteCount} invite{inviteCount === 1 ? "" : "s"}{" "}
            available.
          </TextBody>
        </View>
        <View>
          <Octicons name="chevron-right" color={color.grayDark} size={32} />
        </View>
      </NotificationRow>
    </TouchableHighlight>
  );
}
