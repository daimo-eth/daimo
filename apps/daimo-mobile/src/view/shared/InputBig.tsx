import Octicons from "@expo/vector-icons/Octicons";
import { Icon } from "@expo/vector-icons/build/createIconSet";
import { useCallback, useState } from "react";
import { Platform, StyleSheet, TextInput, View } from "react-native";

import { color, ss } from "./style";

export type OctName = typeof Octicons extends Icon<infer G, any> ? G : never;

export function InputBig({
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  icon,
  center,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  icon?: OctName;
  center?: boolean;
  autoFocus?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const onInputFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, []);
  const onInputBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, []);

  // Android text input incorrectly autocapitalizes. Fix via password input.
  const needsAndroidWorkaround = Platform.OS === "android";

  return (
    <View style={isFocused ? styles.inputRowFocused : styles.inputRow}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={color.grayMid}
        value={value}
        onChangeText={onChange}
        style={center ? styles.inputCentered : styles.input}
        multiline
        numberOfLines={1}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
        secureTextEntry={needsAndroidWorkaround}
        keyboardType={needsAndroidWorkaround ? "visible-password" : "default"}
        onFocus={onInputFocus}
        onBlur={onInputBlur}
      />
      {icon && (
        <View style={styles.inputIcon}>
          <Octicons name={icon} size={16} color={color.primary} />
        </View>
      )}
    </View>
  );
}

const inputRow = {
  flexGrow: 1,
  backgroundColor: color.ivoryDark,
  borderRadius: 99,
  borderColor: color.grayLight,
  borderWidth: 1,
  paddingHorizontal: 20,
  paddingVertical: 12,
} as const;

const input = {
  ...ss.text.body,
  paddingTop: 0,
  paddingVertical: 0,
} as const;

const styles = StyleSheet.create({
  inputRow,
  inputRowFocused: {
    ...inputRow,
    borderColor: color.primary,
  },
  input,
  inputCentered: {
    ...input,
    textAlign: "center",
  },
  inputIcon: {
    position: "absolute",
    top: 13,
    right: 20,
  },
});
