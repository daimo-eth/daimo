import Octicons from "@expo/vector-icons/Octicons";
import { StyleSheet, View } from "react-native";

import { ButtonBig } from "../shared/Button";
import Spacer from "../shared/Spacer";
import { color } from "../shared/style";
import { TextBody, TextH3 } from "../shared/text";

export function CreateBackupSheet() {
  return (
    <View style={{ paddingHorizontal: 24 }}>
      <TextH3>Create a backup</TextH3>
      <Spacer h={16} />
      <View style={styles.separator} />
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={styles.keyCircle}>
          <Octicons name="key" size={24} color={color.primary} />
        </View>
        <Spacer w={12} />
        <TextBody>Set up a passkey backup</TextBody>
        <View style={{}} />
      </View>
      <ButtonBig type="primary" title="Backup with passkey" />
      <ButtonBig type="subtle" title="Backup to seed phrase instead" />
    </View>
  );
}

const styles = StyleSheet.create({
  keyCircle: {
    backgroundColor: color.grayLight,
    height: 40,
    width: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  separator: {
    borderBottomWidth: 0.5,
    borderBottomColor: color.grayLight,
  },
});
