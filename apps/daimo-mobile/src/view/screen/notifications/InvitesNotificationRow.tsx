import Octicons from "@expo/vector-icons/Octicons";
import { StyleSheet, View } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";

import { useNav } from "../../../common/nav";
import { InvitesNotification } from "../../../logic/inAppNotifications";
import { Account } from "../../../model/account";
import { color, touchHighlightUnderlay } from "../../shared/style";
import { TextBody } from "../../shared/text";

export function InvitesNotificationRow({
  notif,
  account,
}: {
  notif: InvitesNotification;
  account: Account;
}) {
  const nav = useNav();

  const inviteCount = notif.inviteLinkStatus.usesLeft || 0;

  return (
    <View style={{ marginHorizontal: 16 }}>
      <TouchableHighlight
        onPress={() => {
          nav.navigate("InviteTab", { screen: "Invite" });
        }}
        {...touchHighlightUnderlay.subtle}
        style={{ marginHorizontal: -16 }}
      >
        <View style={styles.row}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
            <TextBody color={color.midnight}>
              ✨ You have {inviteCount} invite{inviteCount === 1 ? "" : "s"}{" "}
              available.
            </TextBody>
          </View>
          <View>
            <Octicons name="chevron-right" color={color.grayDark} size={32} />
          </View>
        </View>
      </TouchableHighlight>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: color.grayLight,
    marginHorizontal: 16,
    paddingVertical: 16,
  },
});
