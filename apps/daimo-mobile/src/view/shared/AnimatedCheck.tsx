import * as Haptics from "expo-haptics";
import React, { forwardRef, useImperativeHandle } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";

import { color } from "./style";

const APath = Animated.createAnimatedComponent(Path);
const ACircle = Animated.createAnimatedComponent(Circle);
const ASvg = Animated.createAnimatedComponent(Svg);

const PATH_DASH_OFFSET_INIT = 130;
const PATH_SCALE_INIT = 1;
const CIRCLE_DASH_OFFSET_INIT = -380;

export type AnimatedCheckRef = {
  play: () => void;
};

export const AnimatedCheck = forwardRef<AnimatedCheckRef>((_, ref) => {
  const pathDashOffset = useSharedValue(PATH_DASH_OFFSET_INIT);
  const pathScale = useSharedValue(PATH_SCALE_INIT);
  const circleDashOffset = useSharedValue(CIRCLE_DASH_OFFSET_INIT);

  const animateSuccess = () => {
    pathDashOffset.value = PATH_DASH_OFFSET_INIT;
    circleDashOffset.value = CIRCLE_DASH_OFFSET_INIT;
    pathScale.value = PATH_SCALE_INIT;
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      pathDashOffset.value = withDelay(200, withTiming(0, { duration: 800 }));
      circleDashOffset.value = withTiming(0, { duration: 800 });
      pathScale.value = withDelay(200, withTiming(0, { duration: 900 }));
    }, 500);
  };

  useImperativeHandle(ref, () => ({
    play() {
      animateSuccess();
    },
  }));

  const checkmarkProps = useAnimatedProps(() => {
    return {
      opacity: 1 - pathScale.value,
      strokeDashoffset: pathDashOffset.value,
    };
  });

  const circleProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: circleDashOffset.value,
    };
  });

  const pathStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: 1 + pathScale.value,
        },
      ],
    };
  });

  return (
    <View style={styles.wrapper}>
      <Svg
        height="122"
        width="122"
        viewBox="-1 -1 122 122"
        style={styles.circle}
      >
        <ACircle
          cx="60"
          cy="60"
          r="60"
          stroke={color.success}
          strokeWidth="1"
          fill="transparent"
          strokeDasharray={500}
          strokeDashoffset={0}
          animatedProps={circleProps}
        />
      </Svg>
      <ASvg
        width="44"
        height="35"
        viewBox="-1 -1 45 35"
        fill="none"
        style={pathStyle}
      >
        <APath
          d="M2 17.5556L15.8667 32L42 2"
          stroke={color.success}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={100}
          strokeDashoffset={0}
          animatedProps={checkmarkProps}
        />
      </ASvg>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    height: 122,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  circle: {
    position: "absolute",
    transform: [{ rotate: "-90deg" }],
  },
});
