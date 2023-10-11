import Octicons from "@expo/vector-icons/Octicons";
import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { ButtonSmall } from "../../shared/Button";
import Spacer from "../../shared/Spacer";
import { TextLight } from "../../shared/text";

export function CancelHeader({
  children,
  hide,
}: {
  children: ReactNode;
  hide?: () => void;
}) {
  return (
    <View style={styles.cancelHeader}>
      <Spacer w={64} />
      <TextLight>{children}</TextLight>
      {hide && (
        <ButtonSmall onPress={hide}>
          <View style={styles.cancelButton}>
            <Octicons name="x" size={24} color="gray" />
          </View>
        </ButtonSmall>
      )}
      {!hide && <Spacer w={64} />}
    </View>
  );
}

const styles = StyleSheet.create({
  cancelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cancelButton: {
    width: 32,
    height: 40,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
