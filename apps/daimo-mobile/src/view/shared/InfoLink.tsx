import Octicons from "@expo/vector-icons/Octicons";
import { Linking, StyleSheet, View } from "react-native";

import { TextButton } from "./Button";
import { color } from "./style";
import { TextBody } from "./text";

export function InfoLink({ url, title }: { url: string; title: string }) {
  return (
    <TextButton onPress={() => Linking.openURL(url)}>
      <View style={styles.infoLinkRow}>
        <Octicons name="info" size={16} color={color.grayMid} />
        <TextBody color={color.grayMid}>{title}</TextBody>
      </View>
    </TextButton>
  );
}

const styles = StyleSheet.create({
  infoLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
