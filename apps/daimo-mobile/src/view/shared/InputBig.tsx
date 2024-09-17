import Octicons from "@expo/vector-icons/Octicons";
import { Icon } from "@expo/vector-icons/build/createIconSet";
import { RefObject, useCallback, useMemo, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  ViewStyle,
} from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

import { MAX_FONT_SIZE_MULTIPLIER } from "./text";
import { Colorway, SkinStyleSheet } from "../style/skins";
import { useTheme } from "../style/theme";

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
  style,
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
  style?: ViewStyle;
}) {
  const { color, ss } = useTheme();
  const styles = useMemo(() => getStyles(color, ss), [color, ss]);

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
    <TouchableWithoutFeedback onPress={focus} hitSlop={8} accessible={false}>
      <Animated.View
        layout={LinearTransition}
        style={[isFocused ? styles.inputRowFocused : styles.inputRow, style]}
      >
        {icon && (
          <Animated.View
            layout={LinearTransition.delay(10000)}
            style={styles.inputIcon}
          >
            <Octicons name={icon} size={18} color={color.primary} />
          </Animated.View>
        )}
        <TextInput
          ref={ref}
          placeholder={placeholder}
          placeholderTextColor={color.grayMid}
          value={value}
          onChangeText={onChange}
          style={center ? styles.inputCentered : styles.input}
          multiline={Platform.OS === "android" && center}
          numberOfLines={1}
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          autoFocus={autoFocus}
          secureTextEntry={needsAndroidWorkaround}
          keyboardType={needsAndroidWorkaround ? "visible-password" : "default"}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
        />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const getStyles = (color: Colorway, ss: SkinStyleSheet) => {
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
    left: 48,
    right: 16,
    paddingTop: 0,
    paddingVertical: 0,
  } as const;

  return StyleSheet.create({
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
      left: 20,
      width: 16,
      alignContent: "center",
      justifyContent: "center",
    },
  });
};
