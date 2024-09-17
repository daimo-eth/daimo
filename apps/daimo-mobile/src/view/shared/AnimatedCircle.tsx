import React from "react";
import { StyleSheet } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { useTheme } from "../style/theme";

const ACircle = Animated.createAnimatedComponent(Circle);

/** Animated circular progress bar. */
export const AnimatedCircle = ({
  progress,
  size,
  strokeWidth,
}: {
  progress: SharedValue<number>;
  size: number;
  strokeWidth: number;
}) => {
  const { color } = useTheme();
  const componentHeight = size * 2 + strokeWidth * 2;
  const circleProps = useAnimatedProps(() => {
    return {
      strokeDashoffset:
        -size * Math.PI * 2 - progress.value * -size * Math.PI * 2,
    };
  });

  const wrapperStyle = useAnimatedStyle(() => {
    return {
      opacity: Math.min(1, progress.value * 2.5),
      transform: [
        {
          scale: Math.min(1, 0.85 + progress.value * 0.15),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          height: componentHeight,
          width: componentHeight,
        },
        wrapperStyle,
      ]}
    >
      <Svg
        height={componentHeight}
        width={componentHeight}
        viewBox={`-${strokeWidth} -${strokeWidth} ${componentHeight} ${componentHeight}`}
        style={styles.circle}
      >
        <ACircle
          cx={size}
          cy={size}
          r={size}
          stroke={color.white}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={500}
          strokeDashoffset={0}
          animatedProps={circleProps}
        />
      </Svg>
      <Svg
        height={componentHeight}
        width={componentHeight}
        viewBox={`-${strokeWidth} -${strokeWidth} ${componentHeight} ${componentHeight}`}
        style={styles.circleBehind}
      >
        <ACircle
          cx={size}
          cy={size}
          r={size}
          stroke={color.white}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  circle: {
    position: "absolute",
    transform: [{ rotate: "-90deg" }],
  },
  circleBehind: {
    position: "absolute",
    opacity: 0.4,
  },
});
