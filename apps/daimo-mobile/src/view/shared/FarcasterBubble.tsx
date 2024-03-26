import { FarcasterLinkedAccount } from "@daimo/common";
import { Image, Linking, StyleSheet, View } from "react-native";

import { BadgeButton } from "./Button";
import Spacer from "./Spacer";
import image from "./image";
import { color } from "./style";
import { TextBtnCaps, TextMeta } from "./text";
import { FarcasterClient } from "../../profile/farcaster";

export function FarcasterButton({
  fcAccount,
  align,
  hideUsername,
  onPress,
}: {
  fcAccount: FarcasterLinkedAccount;
  align?: "center";
  hideUsername?: boolean;
  onPress?: () => void;
}) {
  const username = FarcasterClient.getDispUsername(fcAccount).toUpperCase();
  if (onPress == null) {
    // Go to profile
    const url = `https://warpcast.com/${fcAccount.username}`;
    onPress = () => Linking.openURL(url);
  }

  return (
    <BadgeButton onPress={onPress}>
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          alignItems: "center",
          justifyContent: align,
        }}
      >
        <Image
          source={{ uri: image.iconFarcaster }}
          style={{ width: 16, height: 16, zIndex: -1 }}
        />
        {!hideUsername && (
          <TextBtnCaps color={color.grayDark}>{username}</TextBtnCaps>
        )}
      </View>
    </BadgeButton>
  );
}

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
      <Spacer w={4} />
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
