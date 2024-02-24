import { useCallback } from "react";
import { StyleSheet, View } from "react-native";

import { DaimoContact, getContactName } from "../../../logic/daimoContacts";
import { ButtonCircle } from "../../shared/ButtonCircle";
import { ContactBubble } from "../../shared/ContactBubble";
import { FarcasterButton } from "../../shared/FarcasterBubble";
import Spacer from "../../shared/Spacer";
import { navToAccountPage, useNav } from "../../shared/nav";
import { TextH3, TextLight } from "../../shared/text";

export function RecipientDisplay({
  recipient,
  isRequest,
}: {
  recipient: DaimoContact;
  isRequest?: boolean;
}) {
  // Show who we're sending to
  const isAccount = recipient.type === "eAcc";
  const disp = getContactName(recipient);

  const subtitle = (function () {
    switch (recipient.type) {
      case "eAcc":
        if (recipient.linkedAccounts?.length) {
          return <FarcasterButton fcAccount={recipient.linkedAccounts[0]} />;
        } else {
          return recipient.originalMatch;
        }
      case "phoneNumber":
        return recipient.phoneNumber;
      case "email":
        return recipient.email;
    }
  })();

  const showSubtitle = subtitle != null && subtitle !== disp;

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
      <TextH3>{disp}</TextH3>
      {showSubtitle && <Spacer h={4} />}
      {showSubtitle && <TextLight>{subtitle}</TextLight>}
    </View>
  );
}

const styles = StyleSheet.create({
  recipientDisp: {
    flexDirection: "column",
    alignItems: "center",
  },
});
