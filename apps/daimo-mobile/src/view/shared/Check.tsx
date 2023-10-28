import { ReactNode } from "react";
import { StyleSheet, TouchableHighlight, View } from "react-native";

import { color } from "./style";
import { TextBody } from "./text";

export function CheckLabel({
  value,
  setValue,
  children,
}: {
  value: boolean;
  setValue: (val: boolean) => void;
  children: ReactNode;
}) {
  return (
    <View style={styles.checkLabel}>
      <Check {...{ value, setValue }} />
      <TextBody>{children}</TextBody>
    </View>
  );
}

export function Check({
  value,
  setValue,
}: {
  value: boolean;
  setValue: (val: boolean) => void;
}) {
  return (
    <TouchableHighlight
      style={value ? styles.checked : styles.unchecked}
      onPress={() => setValue(!value)}
      underlayColor="transparent"
      hitSlop={12}
    >
      <View />
    </TouchableHighlight>
  );
}

const checkbox = {
  width: 16,
  height: 16,
  borderRadius: 4,
  borderWidth: 2,
  borderColor: color.primary,
};

const styles = StyleSheet.create({
  checkLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checked: {
    ...checkbox,
    backgroundColor: color.primary,
  },
  unchecked: checkbox,
});
