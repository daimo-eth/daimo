import { useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { ContactBubble } from "./Bubble";
import { ButtonCircle } from "./ButtonCircle";
import { FarcasterButton } from "./FarcasterBubble";
import Spacer from "./Spacer";
import { TextBtnCaps, TextH2, TextLight } from "./text";
import { navToAccountPage, useNav } from "../../common/nav";
import { i18n } from "../../i18n";
import { DaimoContact, getContactName } from "../../logic/daimoContacts";
import { Colorway } from "../style/skins";
import { useTheme } from "../style/theme";

const i18 = i18n.contactDisplay;

export function ContactDisplay({
  contact,
  isRequest,
  requestMemo,
  onPress,
}: {
  contact: DaimoContact;
  isRequest?: boolean;
  requestMemo?: string;
  onPress?: () => void;
}) {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

  // Show who we're sending to
  const isAccount = contact.type === "eAcc";
  const disp = getContactName(contact);

  const isLandlineBankAccount = contact.type === "landlineBankAccount";

  const subtitle = (function () {
    switch (contact.type) {
      case "eAcc":
        if (requestMemo) {
          return requestMemo;
        } else if (contact.originalMatch) {
          return contact.originalMatch;
        } else return undefined;
      case "phoneNumber":
        return contact.phoneNumber;
      case "email":
        return contact.email;
      default:
        return undefined;
    }
  })();

  const showSubtitle = subtitle != null && subtitle !== disp;

  const showFarcaster =
    contact.type === "eAcc" && (contact.linkedAccounts?.length || 0) > 0;

  const nav = useNav();
  const goToAccount = useCallback(() => {
    if (isAccount) {
      navToAccountPage(contact, nav);
    }
  }, [nav, contact]);

  return (
    <View style={styles.recipientDisp}>
      <ButtonCircle size={64} onPress={onPress ?? goToAccount}>
        <ContactBubble contact={contact} size={64} transparent />
      </ButtonCircle>
      <Spacer h={8} />
      {isRequest && <TextLight>{i18.requestedBy()}</TextLight>}
      {isRequest && <Spacer h={4} />}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!isLandlineBankAccount && <TextH2>{disp}</TextH2>}
        {showFarcaster && <Spacer w={8} />}
        {showFarcaster && (
          <FarcasterButton
            fcAccount={contact.linkedAccounts![0]}
            hideUsername
          />
        )}
      </View>
      {showSubtitle && <Spacer w={4} />}
      {showSubtitle && <SubtitleBubble subtitle={subtitle} />}
    </View>
  );
}

const SubtitleBubble = ({ subtitle }: { subtitle: string }) => {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

  return (
    <View style={styles.subtitleBubble}>
      <TextBtnCaps color={color.grayDark}>{subtitle}</TextBtnCaps>
    </View>
  );
};

const getStyles = (color: Colorway) =>
  StyleSheet.create({
    recipientDisp: {
      flexDirection: "column",
      alignItems: "center",
    },
    subtitleBubble: {
      backgroundColor: color.ivoryDark,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
  });
