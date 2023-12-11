import {
  EAccount,
  formatDaimoLink,
  getAccountName,
  getEAccountStr,
} from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import * as Clipboard from "expo-clipboard";
import { useCallback, useState } from "react";
import { StyleSheet, TouchableHighlight, View } from "react-native";

import Spacer from "./Spacer";
import { color, touchHighlightUnderlay } from "./style";
import { TextH2 } from "./text";

/** Displays an EAccount, and lets you copy a Daimo deeplink to it. */
export function AccountCopyLinkButton({ eAcc }: { eAcc: EAccount }) {
  const acctUrl = formatDaimoLink({
    type: "account",
    account: getEAccountStr(eAcc),
  });
  const [justCopied, setJustCopied] = useState(false);
  const copy = useCallback(async () => {
    await Clipboard.setStringAsync(acctUrl);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1000);
  }, [acctUrl]);

  return (
    <TouchableHighlight
      {...touchHighlightUnderlay.subtle}
      style={styles.button}
      hitSlop={16}
      onPress={copy}
    >
      <TextH2>
        <Spacer w={16} />
        {getAccountName(eAcc)}
        <Spacer w={8} />
        <View style={styles.copyIcon}>
          <Octicons
            name={justCopied ? "check" : "copy"}
            color={color.grayDark}
            size={18}
          />
        </View>
      </TextH2>
    </TouchableHighlight>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginLeft: -8,
    borderRadius: 4,
  },
  copyIcon: {
    width: 18,
  },
});
