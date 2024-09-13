import Octicons from "@expo/vector-icons/Octicons";
import { View } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";

import { NotificationRow } from "./NotificationRow";
import { useNav } from "../../../common/nav";
import { i18n } from "../../../i18n";
import { InvitesNotification } from "../../../logic/inAppNotifications";
import { TextBody } from "../../shared/text";
import { useTheme } from "../../style/theme";

const i18 = i18n.invitesNotification;

export function InvitesNotificationRow({
  notif,
}: {
  notif: InvitesNotification;
}) {
  const { color, touchHighlightUnderlay } = useTheme();
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
            {i18.description(inviteCount)}
          </TextBody>
        </View>
        <View>
          <Octicons name="chevron-right" color={color.grayDark} size={32} />
        </View>
      </NotificationRow>
    </TouchableHighlight>
  );
}
