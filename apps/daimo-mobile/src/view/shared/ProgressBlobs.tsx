import { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { color } from "./style";

export function ProgressBlobs({
  activeStep,
  steps,
}: {
  activeStep: number;
  steps: number;
}) {
  return (
    <Animated.View style={{ flexDirection: "row", gap: 8 }}>
      {Array(steps)
        .fill(0)
        .map((_, index) => (
          <ProgressBlob
            key={index}
            active={activeStep === index}
            done={index < activeStep}
          />
        ))}
    </Animated.View>
  );
}

function ProgressBlob({ active, done }: { active: boolean; done: boolean }) {
  const offset = useSharedValue(20);
  const bg = useSharedValue(color.primary);

  useEffect(() => {
    offset.value = withTiming(active ? 60 : 20);
    bg.value = withTiming(done || active ? color.primary : color.grayLight);
  }, [active, done]);

  const style = useAnimatedStyle(() => ({
    width: offset.value,
    backgroundColor: bg.value,
  }));

  return (
    <Animated.View
      style={[
        { backgroundColor: color.primary, borderRadius: 8, height: 8 },
        style,
      ]}
    />
  );
}
