import Octicons from "@expo/vector-icons/Octicons";
import { Icon } from "@expo/vector-icons/build/createIconSet";
import { RefObject, useCallback, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

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
  innerRef,
}: {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  icon?: OctName;
  center?: boolean;
  autoFocus?: boolean;
  innerRef?: RefObject<TextInput>;
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

  const otherRef = useRef<TextInput>(null);
  const ref = innerRef || otherRef;
  const focus = useCallback(() => {
    ref.current?.focus();
  }, [ref]);

  return (
    <TouchableWithoutFeedback onPress={focus} hitSlop={8}>
      <View style={isFocused ? styles.inputRowFocused : styles.inputRow}>
        <TextInput
          ref={ref}
          placeholder={placeholder}
          placeholderTextColor={color.grayMid}
          value={value}
          onChangeText={onChange}
          style={center ? styles.inputCentered : styles.input}
          multiline={Platform.OS === "android" && center}
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
            <Octicons name={icon} size={18} color={color.primary} />
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const inputRow = {
  flexGrow: 1,
  height: 48,
  backgroundColor: color.ivoryDark,
  borderRadius: 99,
  borderColor: color.grayLight,
  borderWidth: 1,
  paddingHorizontal: 20,
  paddingVertical: 12,
} as const;

const input = {
  ...ss.text.body,
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 16,
  right: 40,
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
    left: 40,
  },
  inputIcon: {
    position: "absolute",
    top: 13,
    right: 20,
  },
});
