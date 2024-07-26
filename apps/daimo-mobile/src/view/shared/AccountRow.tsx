import { EAccount, canSendTo, getAccountName, timeString } from "@daimo/common";
import { StyleSheet, TouchableHighlight, View } from "react-native";

import { ContactBubble } from "./Bubble";
import { PendingDot } from "./PendingDot";
import { color, touchHighlightUnderlay } from "./style";
import { TextBody, TextPara } from "./text";
import { getI18NLocale } from "../../i18n";

export function AccountRow({
  acc,
  timestamp,
  pending,
  viewAccount,
}: {
  acc: EAccount;
  timestamp: number;
  viewAccount?: () => void;
  pending?: boolean;
}) {
  const textDark = pending ? color.gray3 : color.midnight;
  const textLight = pending ? color.gray3 : color.grayMid;

  const date = timeString(timestamp);
  const locale = getI18NLocale();

  return (
    <View style={styles.border}>
      <TouchableHighlight
        onPress={viewAccount}
        disabled={!canSendTo(acc)}
        {...touchHighlightUnderlay.subtle}
        style={styles.rowWrap}
      >
        <View style={styles.row}>
          <View style={styles.otherAccount}>
            <ContactBubble
              contact={{ type: "eAcc", ...acc }}
              size={36}
              isPending={pending}
            />
            <TextBody color={textDark}>{getAccountName(acc, locale)}</TextBody>
            {pending && <PendingDot />}
          </View>
          <TextPara color={textLight}>{date}</TextPara>
        </View>
      </TouchableHighlight>
    </View>
  );
}

const styles = StyleSheet.create({
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
