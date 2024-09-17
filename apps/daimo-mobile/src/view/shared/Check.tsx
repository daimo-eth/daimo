import React, { ReactNode, useCallback, useMemo } from "react";
import { StyleSheet, TouchableWithoutFeedback, View } from "react-native";

import { TextBody } from "./text";
import { Colorway } from "../style/skins";
import { useTheme } from "../style/theme";

export function CheckLabel({
  value,
  setValue,
  children,
}: {
  value: boolean;
  setValue: (val: boolean) => void;
  children: ReactNode;
}) {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

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

const getStyles = (color: Colorway) => {
  const checkbox = {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: color.primary,
  };

  return StyleSheet.create({
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
};
