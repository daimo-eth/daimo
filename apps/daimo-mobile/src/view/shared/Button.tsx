import { ReactNode, useMemo } from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  TextStyle,
  TouchableHighlight,
  View,
  ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { AnimatedCircle } from "./AnimatedCircle";
import { color, touchHighlightUnderlay } from "./style";
import { DaimoText, TextBtnCaps } from "./text";
import FaceIdPrimaryIcon from "../../../assets/face-id-primary.png";
import FaceIdIcon from "../../../assets/face-id.png";

interface TextButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  showBiometricIcon?: boolean;
}

interface ButtonProps extends TextButtonProps {
  type: "primary" | "success" | "danger" | "subtle";
}

interface LongPressButtonProps extends ButtonProps {
  duration: number;
  showBiometricIcon?: boolean;
}

export function LongPressBigButton(props: LongPressButtonProps) {
  const buttonScale = useSharedValue(1);
  const animatedCircleProgress = useSharedValue(0);

  const style = useStyle(buttonStyles.big, props);
  const touchUnderlay = useTouchUnderlay(props.type);
  const disabledStyle = useMemo(
    () => ({ ...style.button, opacity: 0.5 }),
    [style.button]
  );

  const longPress = Gesture.LongPress()
    .minDuration(props.duration)
    .enabled(!props.disabled || false)
    .onBegin(() => {
      buttonScale.value = withTiming(0.97, { duration: props.duration }, () => {
        if (buttonScale.value === 0.97) {
          console.log("[BUTTON] LongPresButton pressed");
          props.onPress && runOnJS(props.onPress)();
        }
      });
      animatedCircleProgress.value = withTiming(1, {
        duration: props.duration,
      });
    })
    .onFinalize((_, success) => {
      console.log("[BUTTON] LongPressButton onFinalize");
      buttonScale.value = withTiming(1);
      animatedCircleProgress.value = withTiming(0);
    });

  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  return (
    <GestureDetector gesture={longPress}>
      <Animated.View
        style={[
          props.disabled ? disabledStyle : style.button,
          buttonStyle,
          styles.centerContent,
        ]}
        {...(touchUnderlay || touchHighlightUnderlay.subtle)}
      >
        <View
          style={{
            width: "100%",
            position: "absolute",
            height: "100%",
            justifyContent: "center",
          }}
        >
          <AnimatedCircle
            progress={animatedCircleProgress}
            strokeWidth={3}
            size={12}
          />
        </View>
        <DaimoText style={style.title}>{props.title?.toUpperCase()}</DaimoText>
        {props.showBiometricIcon && (
          <View style={styles.biometricIconContainer}>
            <Image source={FaceIdIcon} style={styles.biometricIcon} />
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

export function ButtonBig(props: ButtonProps) {
  return (
    <Button
      {...props}
      style={useStyle(buttonStyles.big, props)}
      touchUnderlay={useTouchUnderlay(props.type)}
      icon={props.type === "subtle" ? FaceIdPrimaryIcon : FaceIdIcon}
    />
  );
}

export function ButtonMed(props: ButtonProps) {
  return (
    <Button
      {...props}
      style={useStyle(buttonStyles.med, props)}
      touchUnderlay={useTouchUnderlay(props.type)}
      icon={props.type === "subtle" ? FaceIdPrimaryIcon : FaceIdIcon}
    />
  );
}

export function TextButton(props: TextButtonProps) {
  return (
    <Button
      {...props}
      style={useStyle(buttonStyles.small, props)}
      icon={FaceIdPrimaryIcon}
    />
  );
}

export function BadgeButton({
  title,
  children,
  onPress,
}: {
  title?: string;
  children?: ReactNode;
  onPress?: () => void;
}) {
  return (
    <View style={{ paddingVertical: 8 }}>
      <TouchableHighlight
        onPress={onPress}
        style={{
          backgroundColor: color.ivoryDark,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 8,
        }}
        hitSlop={24}
        {...touchHighlightUnderlay.subtle}
      >
        {children || <TextBtnCaps color={color.grayDark}>{title}</TextBtnCaps>}
      </TouchableHighlight>
    </View>
  );
}

function useStyle(base: ButtonStyle, props: TextButtonProps) {
  const { type } = props as ButtonProps;
  const btnOverride = useMemo<ViewStyle>(() => {
    switch (type) {
      case "primary":
        return { backgroundColor: color.primary };
      case "danger":
        return { backgroundColor: color.danger };
      case "success":
        return { backgroundColor: color.success };
      case "subtle": // Hollow, primary border on white background
        return {
          backgroundColor: color.white,
          borderWidth: 1,
          borderColor: color.primary,
        };
      default: // Text button. No fill, no border
        return {};
    }
  }, [type]);

  const titleOverride = useMemo<TextStyle>(() => {
    switch (type) {
      case "primary":
      case "danger":
      case "success":
        return { color: color.white };
      default:
        return { color: color.primary };
    }
  }, [type]);

  const style = useMemo(
    () => ({
      button: { ...base.button, ...btnOverride },
      title: { ...base.title, ...titleOverride },
    }),
    [base, btnOverride]
  );
  return style;
}

function useTouchUnderlay(type: ButtonProps["type"]) {
  return useMemo(() => {
    switch (type) {
      case "success":
        return touchHighlightUnderlay.success;
      case "danger":
        return touchHighlightUnderlay.danger;
      case "primary":
        return touchHighlightUnderlay.primary;
      case "subtle":
      default:
        return touchHighlightUnderlay.subtle;
    }
  }, [type]);
}

type ButtonStyle = { button: ViewStyle; title: TextStyle };

function Button(
  props: TextButtonProps & {
    style: ButtonStyle;
    touchUnderlay?: ReturnType<typeof useTouchUnderlay>;
    icon?: ImageSourcePropType;
  }
) {
  const disabledStyle = useMemo(
    () => ({ ...props.style.button, opacity: 0.5 }),
    [props.style.button]
  );

  const child = props.title ? (
    <DaimoText style={props.style.title}>{props.title.toUpperCase()}</DaimoText>
  ) : (
    props.children
  );

  return (
    <TouchableHighlight
      onPress={props.onPress}
      style={props.disabled ? disabledStyle : props.style.button}
      disabled={props.disabled}
      {...(props.touchUnderlay || touchHighlightUnderlay.subtle)}
    >
      <View style={styles.centerContent}>
        {child}
        {props.showBiometricIcon && props.icon && (
          <View style={styles.biometricIconContainer}>
            <Image source={props.icon} style={styles.biometricIcon} />
          </View>
        )}
      </View>
    </TouchableHighlight>
  );
}

const buttonStyles = {
  big: StyleSheet.create({
    button: {
      paddingHorizontal: 24,
      paddingVertical: 20,
      borderRadius: 4,
      backgroundColor: color.primaryBgLight,
    },
    title: {
      fontSize: 14,
      fontWeight: "bold",
      letterSpacing: 1,
      textAlign: "center",
    },
  }),
  med: StyleSheet.create({
    button: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderRadius: 6,
      backgroundColor: color.primaryBgLight,
    },
    title: {
      fontSize: 14,
      fontWeight: "bold",
      letterSpacing: 1,
      textAlign: "center",
    },
  }),
  small: StyleSheet.create({
    button: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    title: {
      fontSize: 14,
      fontWeight: "bold",
      letterSpacing: 1,
      textAlign: "center",
    },
  }),
};

const styles = StyleSheet.create({
  biometricIconContainer: {
    width: 0,
    left: 8,
    height: 0,
    justifyContent: "center",
  },
  biometricIcon: {
    height: 24,
    width: 24,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
});
