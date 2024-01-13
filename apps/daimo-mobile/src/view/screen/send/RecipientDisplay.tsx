import { useCallback } from "react";
import { View, StyleSheet } from "react-native";

import { Recipient, getRecipientName } from "../../../sync/recipients";
import { AccountBubble } from "../../shared/AccountBubble";
import { ButtonCircle } from "../../shared/ButtonCircle";
import Spacer from "../../shared/Spacer";
import { useNav } from "../../shared/nav";
import { TextH3, TextLight } from "../../shared/text";

export function RecipientDisplay({
  recipient,
  isRequest,
}: {
  recipient: Recipient;
  isRequest?: boolean;
}) {
  // Show who we're sending to
  const isAccount = recipient.type === "account";
  const disp = getRecipientName(recipient);
  const subtitle = isAccount ? recipient.originalMatch : recipient.name;
  const showSubtitle = subtitle != null && subtitle !== disp;

  const nav = useNav();
  const goToAccount = useCallback(() => {
    if (isAccount)
      nav.navigate("SendTab", {
        screen: "Account",
        params: { eAcc: recipient },
      });
  }, [nav, recipient]);

  return (
    <View style={styles.recipientDisp}>
      <ButtonCircle size={64} onPress={goToAccount}>
        <AccountBubble recipient={recipient} size={64} transparent />
      </ButtonCircle>
      <Spacer h={16} />
      {isRequest && <TextLight>Requested by</TextLight>}
      {isRequest && <Spacer h={8} />}
      <TextH3>{disp}</TextH3>
      {showSubtitle && <Spacer h={8} />}
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
