import { EAccount, timeAgo } from "@daimo/common";
import { useMemo } from "react";
import { ScrollView, StyleSheet, TouchableHighlight, View } from "react-native";

import { navToAccountPage, useNav } from "../../common/nav";
import { i18NLocale, i18n } from "../../i18n";
import { Account } from "../../storage/account";
import { ContactBubble } from "../shared/Bubble";
import { ScreenHeader } from "../shared/ScreenHeader";
import { TextBody } from "../shared/text";
import { useWithAccount } from "../shared/withAccount";
import { Colorway } from "../style/skins";
import { useTheme } from "../style/theme";

const i18 = i18n.yourInvites;

export function YourInvitesScreen() {
  const Inner = useWithAccount(YourInvitesScreenInner);
  return <Inner />;
}

function YourInvitesScreenInner({ account }: { account: Account }) {
  const { color, ss } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

  const nav = useNav();

  const invitees = account.invitees;

  return (
    <View style={ss.container.screen}>
      <ScreenHeader title={i18.screenHeader()} onBack={nav.goBack} />
      <ScrollView style={styles.list}>
        {invitees.map((invitee) => (
          <InviteeRow key={invitee.addr} invitee={invitee} />
        ))}
      </ScrollView>
    </View>
  );
}

function InviteeRow({ invitee }: { invitee: EAccount }) {
  const { color, touchHighlightUnderlay } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

  const nav = useNav();

  return (
    <View style={{ marginHorizontal: 16 }}>
      <TouchableHighlight
        onPress={() => navToAccountPage(invitee, nav)}
        {...touchHighlightUnderlay.subtle}
        style={styles.rowUnderlayWrap}
      >
        <View style={styles.inviteeRow}>
          <View style={styles.inviteeRowLeft}>
            <ContactBubble contact={{ type: "eAcc", ...invitee }} size={36} />
            <TextBody color={color.midnight}>{invitee.name}</TextBody>
          </View>
          <View style={styles.inviteeRowRight}>
            {invitee.timestamp && (
              <TextBody color={color.gray3}>
                {i18.joinedAgo(timeAgo(invitee.timestamp, i18NLocale))}
              </TextBody>
            )}
          </View>
        </View>
      </TouchableHighlight>
    </View>
  );
}

const getStyles = (color: Colorway) =>
  StyleSheet.create({
    list: {
      backgroundColor: color.white,
      marginHorizontal: -16,
    },
    inviteeRow: {
      paddingVertical: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderColor: color.grayLight,
      marginHorizontal: 16,
    },
    inviteeRowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    inviteeRowRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    rowUnderlayWrap: {
      marginHorizontal: -16,
    },
  });
