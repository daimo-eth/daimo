import { useEffect, useReducer, useState } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ButtonBig } from "../shared/Button";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { color, ss } from "../shared/style";
import { TextBody } from "../shared/text";

export function SeedPhraseScreen() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <View style={{ flex: 1, backgroundColor: color.white }}>
      <ScreenHeader title="Seed phrase" />
      <ProgressBlobs steps={2} activeStep={activeStep} />
      <Spacer h={24} />
      {/* Test animation of progress blobs */}
      {activeStep === 0 ? <CopySeedPhrase /> : <VerifySeedPhrase />}
    </View>
  );
}

function ProgressBlobs({
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
          <ProgressBlob key={index} active={activeStep === index} />
        ))}
    </Animated.View>
  );
}

function ProgressBlob({ active }: { active: boolean }) {
  const offset = useSharedValue(20);
  const bg = useSharedValue(color.primary);

  useEffect(() => {
    offset.value = withTiming(active ? 60 : 20);
    bg.value = withTiming(active ? color.primary : color.grayLight);
  }, [active]);

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

function CopySeedPhrase() {
  return (
    <View>
      <TextBody color={color.grayDark}>
        Your account will be backed up to the seed phrase, allowing you to
        recover it even if you lose your device.
      </TextBody>
      <SeedPhraseBox mode="read" />
      <Spacer h={24} />
      <ButtonBig type="primary" title="Continue" />
    </View>
  );
}

function VerifySeedPhrase() {
  return (
    <View>
      <TextBody color={color.grayDark}>
        Type your seed phrase into the input box.
      </TextBody>
      <SeedPhraseBox mode="edit" />
      <Spacer h={24} />
      <ButtonBig type="primary" title="Finish Setup" />
    </View>
  );
}

function SeedPhraseBox({ mode }: { mode: "read" | "edit" }) {
  useSeedPhraseInput();

  return <View style={styles.box} />;
}

function useSeedPhraseInput() {
  return useReducer(
    (state: any, next: any) => {
      return { ...state, [next.key]: next.value };
    },
    {
      1: "",
      2: "",
      3: "",
      4: "",
      5: "",
      6: "",
      7: "",
      8: "",
      9: "",
      10: "",
      11: "",
      12: "",
    }
  );
}

const styles = StyleSheet.create({
  box: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: color.white,
    ...ss.container.shadow,
  },
});
