import { SuggestedAction } from "@daimo/api";
import Octicons from "@expo/vector-icons/Octicons";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { OctName } from "./InputBig";
import { color } from "./style";
import { TextBody } from "./text";

const ADDITIONAL_TOP_PADDING = 4;

export function InfoToast({ action }: { action: SuggestedAction }) {
  const { icon, title, subtitle } = action;
  const [isVisible, setIsVisible] = useState(false);
  const ins = useSafeAreaInsets();
  const top = Math.max(ins.top, 16);
  const y = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  const wasCancelled = useSharedValue(false);

  useEffect(() => {
    if (!isVisible) {
      setTimeout(() => {
        setIsVisible(true);
      }, 2000);
    } else {
      y.value = withSpring(0);
      opacity.value = withTiming(1);
    }
  }, [isVisible]);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: { startY: number }) => {
      ctx.startY = y.value;
      scale.value = withTiming(0.98);
      wasCancelled.value = false;
    },
    onActive: (event, ctx: { startY: number }) => {
      const offset = ctx.startY + event.translationY;
      const frictionPower = 1 - offset / 900;
      if (offset > 0) {
        opacity.value = 1;
        if (frictionPower > 0.476) {
          y.value = offset * frictionPower;
        }
      } else {
        y.value = offset;
        opacity.value = 1 - Math.min(1, -offset / 40);
      }

      if (y.value < -10 || y.value > 10) {
        wasCancelled.value = true;
      }
    },
    onCancel: () => {
      scale.value = withTiming(1);
      y.value = withSpring(0);
      opacity.value = withTiming(1);
    },
    onFinish: () => {
      scale.value = withTiming(1.3);
      if (!wasCancelled.value) {
        opacity.value = withTiming(0, {}, () => {
          runOnJS(setIsVisible)(false);
          scale.value = 1;
          y.value = -100;
        });
      } else {
        if (y.value < -20) {
          y.value = withSpring(-100);
          opacity.value = withTiming(0);
          runOnJS(setIsVisible)(false);
        } else {
          y.value = withSpring(0);
          opacity.value = withTiming(1);
        }
        scale.value = withTiming(1);
      }
      wasCancelled.value = false;
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        {
          scale: scale.value,
        },
        {
          translateY: y.value,
        },
      ],
    };
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View
        style={[
          styles.animatedWrapper,
          {
            top: top + ADDITIONAL_TOP_PADDING,
          },
          animatedStyle,
        ]}
      >
        <View style={styles.bubble}>
          <View style={styles.bubbleIcon}>
            {!icon && <TextBody color={color.white}>i</TextBody>}
            {icon && (
              <Octicons name={icon as OctName} size={16} color={color.white} />
            )}
          </View>
          <View style={styles.bubbleText}>
            <TextBody>{title}</TextBody>
            <TextBody color={color.grayDark}>{subtitle}</TextBody>
          </View>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  animatedWrapper: {
    position: "absolute",
    width: "100%",
    zIndex: 10000,
  },
  bubble: {
    backgroundColor: color.ivoryDark,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
    marginHorizontal: 8,
  },
  bubbleIcon: {
    backgroundColor: color.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: 32,
    height: 32,
    borderRadius: 32,
  },
  bubbleText: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
