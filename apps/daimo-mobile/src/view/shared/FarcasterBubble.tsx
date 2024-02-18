import { FarcasterLinkedAccount } from "@daimo/common";
import { Image, StyleSheet, View } from "react-native";

import Spacer from "./Spacer";
import image from "./image";
import { color } from "./style";
import { TextMeta } from "./text";
import { FarcasterClient } from "../../profile/farcaster";

export function FarcasterBubble({
  fcAccount,
}: {
  fcAccount: FarcasterLinkedAccount;
}) {
  const dispUsername = FarcasterClient.getDispUsername(fcAccount);

  return (
    <View style={styles.row}>
      <Image
        source={{ uri: image.iconFarcaster }}
        style={{ width: 12, height: 12 }}
      />
      <Spacer w={2} />
      <TextMeta color={color.grayMid}>{dispUsername}</TextMeta>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
