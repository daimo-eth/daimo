import { useCallback } from "react";
import { StyleSheet, View } from "react-native";

import { navToAccountPage, useNav } from "../../../common/nav";
import { DaimoContact, getContactName } from "../../../logic/daimoContacts";
import { ButtonCircle } from "../../shared/ButtonCircle";
import { ContactBubble } from "../../shared/ContactBubble";
import { FarcasterButton } from "../../shared/FarcasterBubble";
import Spacer from "../../shared/Spacer";
import { color } from "../../shared/style";
import { TextBtnCaps, TextH2, TextLight } from "../../shared/text";

export function RecipientDisplay({
  recipient,
  isRequest,
  requestMemo,
}: {
  recipient: DaimoContact;
  isRequest?: boolean;
  requestMemo?: string;
}) {
  // Show who we're sending to
  const isAccount = recipient.type === "eAcc";
  const disp = getContactName(recipient);

  const subtitle = (function () {
    switch (recipient.type) {
      case "eAcc":
        if (requestMemo) {
          return requestMemo;
        } else if (recipient.originalMatch) {
          return recipient.originalMatch;
        } else return undefined;
      case "phoneNumber":
        return recipient.phoneNumber;
      case "email":
        return recipient.email;
    }
  })();

  const showSubtitle = subtitle != null && subtitle !== disp;

  const showFarcaster =
    recipient.type === "eAcc" && (recipient.linkedAccounts?.length || 0) > 0;

  const nav = useNav();
  const goToAccount = useCallback(() => {
    if (isAccount) {
      navToAccountPage(recipient, nav);
    }
  }, [nav, recipient]);

  return (
    <View style={styles.recipientDisp}>
      <ButtonCircle size={64} onPress={goToAccount}>
        <ContactBubble contact={recipient} size={64} transparent />
      </ButtonCircle>
      <Spacer h={8} />
      {isRequest && <TextLight>Requested by</TextLight>}
      {isRequest && <Spacer h={4} />}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <TextH2>{disp}</TextH2>
        {showFarcaster && <Spacer w={8} />}
        {showFarcaster && (
          <FarcasterButton
            fcAccount={recipient.linkedAccounts![0]}
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
  return (
    <View style={styles.subtitleBubble}>
      <TextBtnCaps color={color.grayDark}>{subtitle}</TextBtnCaps>
    </View>
  );
};

const styles = StyleSheet.create({
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
