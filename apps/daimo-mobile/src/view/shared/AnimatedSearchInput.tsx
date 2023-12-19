import Octicons from "@expo/vector-icons/Octicons";
import { RefObject, useCallback, useRef, useState } from "react";
import {
  Dimensions,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedRef,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { OctName } from "./InputBig";
import { color, ss } from "./style";

const SCREEN_WIDTH = Dimensions.get("window").width;
const animationConfig = { duration: 150 };

export function AnimatedSearchInput({
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
  const wrapperRef = useAnimatedRef<View>();
  const ref = innerRef || otherRef;
  const focus = useCallback(() => {
    ref.current?.focus();
  }, [ref]);

  const [width, setWidth] = useState(SCREEN_WIDTH - 16 * 2);

  const wrapperStyle = useAnimatedStyle(() => {
    const icons = (50 + 16) * 2;
    const backIcon = 30 + 8;
    const closedWidth = width - icons;
    const openWidth = width - backIcon;

    return {
      width: isFocused
        ? withTiming(openWidth, animationConfig)
        : withTiming(closedWidth, animationConfig),
      left: isFocused
        ? withTiming(backIcon / 2, animationConfig)
        : withTiming(0, animationConfig),
    };
  });

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      style={styles.wrapperStyle}
      ref={wrapperRef}
      pointerEvents="box-none"
      onLayout={onLayout}
    >
      <TouchableWithoutFeedback onPress={focus} hitSlop={8}>
        <Animated.View
          style={[
            isFocused ? styles.inputRowFocused : styles.inputRow,
            style,
            wrapperStyle,
          ]}
        >
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
            keyboardType={
              needsAndroidWorkaround ? "visible-password" : "default"
            }
            onFocus={onInputFocus}
            onBlur={onInputBlur}
          />
          {icon && (
            <Animated.View style={styles.inputIcon}>
              <Octicons name={icon} size={18} color={color.primary} />
            </Animated.View>
          )}
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const inputRow = {
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
    width: 16,
    alignContent: "center",
    justifyContent: "center",
  },
  wrapperStyle: {
    width: "100%",
    alignItems: "center",
    zIndex: 11,
  },
});
