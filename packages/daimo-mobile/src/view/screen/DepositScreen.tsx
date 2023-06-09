import { Octicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableHighlight, View } from "react-native";

import { useAccount } from "../../logic/account";
import { ButtonMed } from "../shared/Button";
import { color, ss, touchHighlightUnderlay } from "../shared/style";
import { TextBody, TextBold, TextSmall } from "../shared/text";
import { assert } from "../../logic/assert";

export default function DepositScreen() {
  const [account] = useAccount();
  assert(account != null);

  const requestFaucet = useCallback(() => console.log("TODO"), []);

  return (
    <View style={styles.vertOuter}>
      <View style={styles.warning}>
        <TextBody>
          <Octicons name="alert" size={16} color="black" />{" "}
          <TextBold>Testnet version.</TextBold> This unreleased version of Daimo
          runs on Base Goerli.
        </TextBody>
        <View style={ss.spacer.h16} />
        <ButtonMed title="Request $10 from faucet" onPress={requestFaucet} />
      </View>
      <View style={ss.spacer.h32} />
      <TextBody>
        <TextBold>Deposit USDC on Base Goerli only.</TextBold> Use the following
        address.
      </TextBody>
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
      <TextSmall>{justCopied ? "Copied" : " "}</TextSmall>
    </View>
  );
}

const styles = StyleSheet.create({
  vertOuter: {
    backgroundColor: color.white,
    flex: 1,
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
  warning: {
    backgroundColor: color.bg.lightYellow,
    padding: 16,
    marginHorizontal: -16,
    borderRadius: 24,
  },
});
