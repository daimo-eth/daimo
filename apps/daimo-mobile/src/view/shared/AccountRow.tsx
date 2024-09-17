import { timeString, TransferClogStatus } from "@daimo/common";
import { useMemo } from "react";
import { StyleSheet, TouchableHighlight, View } from "react-native";

import { ContactBubble } from "./Bubble";
import { FailedDot, PendingDot, ProcessingDot } from "./StatusDot";
import { TextBody, TextPara } from "./text";
import { i18NLocale } from "../../i18n";
import {
  canSendToContact,
  DaimoContact,
  getContactName,
} from "../../logic/daimoContacts";
import { Colorway } from "../style/skins";
import { useTheme } from "../style/theme";

export function AccountRow({
  contact,
  timestamp,
  status,
  viewAccount,
}: {
  contact: DaimoContact;
  timestamp: number;
  viewAccount?: () => void;
  status?: TransferClogStatus;
}) {
  const { color, touchHighlightUnderlay } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

  const textDark = status === "pending" ? color.gray3 : color.midnight;
  const textLight = status === "pending" ? color.gray3 : color.grayMid;

  const date = timeString(timestamp);

  return (
    <View style={styles.border}>
      <TouchableHighlight
        onPress={viewAccount}
        disabled={!canSendToContact(contact)}
        {...touchHighlightUnderlay.subtle}
        style={styles.rowWrap}
      >
        <View style={styles.row}>
          <View style={styles.otherAccount}>
            <ContactBubble
              contact={contact}
              size={36}
              isPending={status === "pending"}
            />
            <TextBody color={textDark}>
              {getContactName(contact, i18NLocale)}
            </TextBody>
            {status === "pending" && <PendingDot />}
            {status === "processing" && <ProcessingDot />}
            {status === "failed" && <FailedDot />}
          </View>
          <TextPara color={textLight}>{date}</TextPara>
        </View>
      </TouchableHighlight>
    </View>
  );
}

const getStyles = (color: Colorway) =>
  StyleSheet.create({
    border: {
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: color.grayLight,
    },
    rowWrap: {
      marginHorizontal: -24,
    },
    row: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    otherAccount: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
  });
