import { View, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";

import { ButtonBig } from "../shared/Button";
import Spacer from "../shared/Spacer";
import { color, ss } from "../shared/style";
import { TextBody } from "../shared/text";

export function SeedPhraseScreen() {
  return <View />;
}

export function ProgressBlobs({
  activeStep,
  steps,
}: {
  activeStep: number;
  steps: number;
}) {
  return <Animated.View />;
}

export function CopySeedPhrase() {
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

function SeedPhraseBox({ mode }: { mode: "read" | "edit" }) {
  return <View style={styles.box} />;
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: color.white,
    ...ss.container.shadow,
  },
});
