import { Octicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableHighlight, View } from "react-native";

import { useAccount } from "../../logic/account";
import { color, ss, touchHighlightUnderlay } from "../shared/style";

export default function DepositScreen() {
  const [account] = useAccount();

  return (
    <View style={styles.outerView}>
      <Text style={ss.text.h2}>Deposit</Text>
      <Text style={ss.text.body}>
        <Text style={ss.text.bodyBold}>Deposit USDC on Base only.</Text> Use the
        following address.
      </Text>
      <Address addr={account.address} />
    </View>
  );
}

function Address({ addr }: { addr: string }) {
  const [justCopied, setJustCopied] = useState(false);
  const copy = useCallback(async () => {
    await Clipboard.setStringAsync(addr);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1000);
  }, [addr]);

  return (
    <View style={styles.address}>
      <TouchableHighlight
        style={styles.addressButton}
        onPress={copy}
        {...touchHighlightUnderlay}
      >
        <View style={styles.addressView}>
          <Text style={styles.addressMono} numberOfLines={1}>
            {addr}
          </Text>
          <Octicons name="copy" size={16} color="black" />
        </View>
      </TouchableHighlight>
      <Text style={ss.text.bodyGray}>{justCopied ? "Copied" : " "}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  outerView: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 32,
    gap: 16,
    overflow: "hidden",
  },
  address: {
    flexDirection: "column",
    gap: 16,
    alignItems: "center",
  },
  addressButton: {
    borderRadius: 8,
    backgroundColor: color.bg.lightGray,
    padding: 16,
  },
  addressView: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  addressMono: {
    ...ss.text.mono,
    flexShrink: 1,
  },
});
