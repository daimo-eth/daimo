import Octicons from "@expo/vector-icons/Octicons";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { OctName } from "./InputBig";
import { MAX_FONT_SIZE_MULTIPLIER } from "./text";
import { Colorway, SkinStyleSheet } from "../style/skins";
import { useTheme } from "../style/theme";

const SCREEN_WIDTH = Dimensions.get("window").width;
const INITIAL_WIDTH = SCREEN_WIDTH - 16 * 2;
const ICONS = (50 + 16) * 2;
const BACK_ICON = 30 + 8;

const animationConfig = { duration: 150 };

interface AnimatedSearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onClose?: () => void;
  placeholder?: string;
  icon?: OctName;
  center?: boolean;
  autoFocus?: boolean;
  innerRef?: RefObject<TextInput>;
  style?: ViewStyle;
}

export const AnimatedSearchInput = ({
  value,
  onChange,
  onFocus,
  onBlur,
  onClose,
  placeholder,
  icon,
  center,
  autoFocus,
  innerRef,
  style,
}: AnimatedSearchInputProps) => {
  const { color, ss } = useTheme();
  const styles = useMemo(() => getStyles(color, ss), [color, ss]);

  const closedWidth = useSharedValue(INITIAL_WIDTH - ICONS);
  const openWidth = useSharedValue(INITIAL_WIDTH - BACK_ICON);
  const animatedWidth = useSharedValue(closedWidth.value);

  const closedLeft = 0;
  const openLeft = BACK_ICON / 2;
  const animatedLeft = useSharedValue(closedLeft);

  const animateOpenInput = () => {
    animatedWidth.value = withTiming(openWidth.value, animationConfig);
    animatedLeft.value = withTiming(openLeft, animationConfig);
  };

  const animateCloseInput = () => {
    animatedWidth.value = withTiming(closedWidth.value, animationConfig);
    animatedLeft.value = withTiming(closedLeft, animationConfig);
  };

  const [isFocused, setIsFocused] = useState(false);
  const onInputFocus = useCallback(() => {
    animateOpenInput();
    setIsFocused(true);
    onFocus?.();
  }, []);
  const onInputBlur = useCallback(() => {
    if (value?.length === 0) {
      animateCloseInput();
      onClose?.();
    }
    setIsFocused(false);
    onBlur?.();
  }, [value]);

  useEffect(() => {
    if (value === undefined) animateCloseInput();
  }, [value]);

  // Android text input incorrectly autocapitalizes. Fix via password input.
  const needsAndroidWorkaround = Platform.OS === "android";

  const otherRef = useRef<TextInput>(null);
  const wrapperRef = useAnimatedRef<View>();
  const inputRef = innerRef || otherRef;
  const focus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const wrapperStyle = useAnimatedStyle(() => {
    return {
      width: animatedWidth.value,
      left: animatedLeft.value,
    };
  });

  const onLayout = (event: LayoutChangeEvent) => {
    const newClosedWidth = event.nativeEvent.layout.width - ICONS;
    const newOpenWidth = event.nativeEvent.layout.width - BACK_ICON;

    closedWidth.value = newClosedWidth;
    openWidth.value = newOpenWidth;

    animatedWidth.value = isFocused ? newOpenWidth : newClosedWidth;
    animatedLeft.value = isFocused ? openLeft : closedLeft;
  };

  return (
    <View
      style={styles.wrapperStyle}
      ref={wrapperRef}
      pointerEvents="box-none"
      onLayout={onLayout}
    >
      <TouchableWithoutFeedback onPress={focus} hitSlop={8} accessible={false}>
        <Animated.View
          style={[
            isFocused ? styles.inputRowFocused : styles.inputRow,
            style,
            wrapperStyle,
          ]}
        >
          {icon && (
            <Animated.View style={styles.inputIcon}>
              <Octicons name={icon} size={18} color={color.primary} />
            </Animated.View>
          )}
          <TextInput
            ref={inputRef}
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
            keyboardType={
              needsAndroidWorkaround ? "visible-password" : "default"
            }
            onFocus={onInputFocus}
            onBlur={onInputBlur}
            selectTextOnFocus
          />
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const getStyles = (color: Colorway, ss: SkinStyleSheet) => {
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
    wrapperStyle: {
      width: "100%",
      alignItems: "center",
      zIndex: 11,
    },
  });
};
