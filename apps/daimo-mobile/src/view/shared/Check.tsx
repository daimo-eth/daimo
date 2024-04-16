import React, { ReactNode, useCallback } from "react";
import { StyleSheet, TouchableWithoutFeedback, View } from "react-native";

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
  const toggle = useCallback(() => setValue(!value), [value, setValue]);

  return (
    <TouchableWithoutFeedback onPress={toggle} hitSlop={12} accessible={false}>
      <View style={styles.checkLabel}>
        <View style={value ? styles.checked : styles.unchecked} />
        <TextBody>{children}</TextBody>
      </View>
    </TouchableWithoutFeedback>
  );
}

const checkbox = {
  width: 18,
  height: 18,
  borderRadius: 6,
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
