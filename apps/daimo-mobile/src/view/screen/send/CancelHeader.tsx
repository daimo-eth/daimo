import { Octicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { ButtonSmall } from "../../shared/Button";
import Spacer from "../../shared/Spacer";
import { TextSmall } from "../../shared/text";

export function CancelHeader({
  children,
  hide,
}: {
  children: ReactNode;
  hide: () => void;
}) {
  return (
    <ButtonSmall onPress={hide}>
      <View style={styles.cancelHeader}>
        <Spacer h={8} />
        <TextSmall>{children}</TextSmall>
        <Octicons name="x" size={20} color="gray" />
      </View>
    </ButtonSmall>
  );
}

const styles = StyleSheet.create({
  cancelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 8,
  },
});
