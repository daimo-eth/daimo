import Octicons from "@expo/vector-icons/Octicons";
import { Icon } from "@expo/vector-icons/build/createIconSet";
import { useCallback, useState } from "react";
import { Platform, StyleSheet, TextInput, View } from "react-native";

import { color, ss } from "./style";

export type OctName = typeof Octicons extends Icon<infer G, any> ? G : never;

export function InputBig({
  value,
  onChange,
  placeholder,
  icon,
  center,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: OctName;
  center?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const onFocus = useCallback(() => setIsFocused(true), []);
  const onBlur = useCallback(() => setIsFocused(false), []);

  // Android text input incorrectly autocapitalizes. Fix via password input.
  const needsAndroidWorkaround = Platform.OS === "android";

  return (
    <View style={isFocused ? styles.inputRowFocused : styles.inputRow}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={color.gray}
        value={value}
        onChangeText={onChange}
        style={center ? styles.inputCentered : styles.input}
        multiline
        numberOfLines={1}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={needsAndroidWorkaround}
        keyboardType={needsAndroidWorkaround ? "visible-password" : "default"}
        {...{ onFocus, onBlur }}
      />
      {icon && <Octicons name={icon} size={16} color="gray" />}
    </View>
  );
}

const inputRow = {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  backgroundColor: color.bg.lightGray,
  borderRadius: 8,
  paddingHorizontal: 16,
  paddingVertical: 12,
} as const;

const input = {
  ...ss.text.body,
  flexGrow: 1,
  paddingTop: 0,
  paddingVertical: 0,
} as const;

const styles = StyleSheet.create({
  inputRow,
  inputRowFocused: {
    ...inputRow,
    backgroundColor: color.bg.blue,
  },
  input,
  inputCentered: {
    ...input,
    textAlign: "center",
  },
});
