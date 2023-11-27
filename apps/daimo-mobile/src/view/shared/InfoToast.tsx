import { SuggestedAction } from "@daimo/api";
import Octicons from "@expo/vector-icons/Octicons";
import { useEffect, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
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
import { handleDeepLink, useNav } from "./nav";
import { color } from "./style";
import { TextBody } from "./text";
import { useAccount } from "../../model/account";

const ADDITIONAL_TOP_PADDING = 4;

export function InfoToast({ action }: { action: SuggestedAction }) {
  const nav = useNav();
  const [account, setAccount] = useAccount();
  const { icon, title, subtitle } = action;
  const [isVisible, setIsVisible] = useState(true);
  const ins = useSafeAreaInsets();
  const top = Math.max(ins.top, 16);
  const y = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  const wasCancelled = useSharedValue(false);

  const onPress = () => {
    setIsVisible(false);

    if (action.url.startsWith("http")) {
      Linking.openURL(action.url);
    } else if (action.url.startsWith("daimo")) {
      handleDeepLink(nav, action.url);
    }

    if (account) {
      setAccount({
        ...account,
        suggestedActions:
          account?.suggestedActions?.filter(
            (a: SuggestedAction) => a.id === action.id
          ) || [],
      });
    }
  };

  const onDismiss = () => {
    setIsVisible(false);

    if (account) {
      setAccount({
        ...account,
        dismissedActionIDs: [...account.dismissedActionIDs, action.id],
        suggestedActions:
          account?.suggestedActions?.filter(
            (a: SuggestedAction) => a.id === action.id
          ) || [],
      });
    }
  };

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
      if (!wasCancelled.value) {
        scale.value = withTiming(1.3);
        opacity.value = withTiming(0, {}, () => {
          runOnJS(onPress)();
          scale.value = 1;
          y.value = -100;
        });
      } else {
        if (y.value < -20) {
          y.value = withSpring(-100);
          opacity.value = withTiming(0);
          runOnJS(onDismiss)();
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
    flexDirection: "column",
    flexWrap: "wrap",
  },
});
