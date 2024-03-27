import { useCallback, useReducer, useState } from "react";
import { View, StyleSheet } from "react-native";

import { useNav } from "../../common/nav";
import { ButtonBig } from "../shared/Button";
import { ProgressBlobs } from "../shared/ProgressBlobs";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { color, ss } from "../shared/style";
import { TextBody } from "../shared/text";

export function SeedPhraseScreen() {
  const [activeStep, setActiveStep] = useState(0);
  const nav = useNav();

  const handleBack = useCallback(() => {
    if (activeStep === 1) {
      setActiveStep(0);
    } else {
      nav.goBack();
    }
  }, [activeStep, nav]);

  return (
    <View
      style={{ flex: 1, backgroundColor: color.white, paddingHorizontal: 24 }}
    >
      <ScreenHeader
        title={`${activeStep === 0 ? "Copy" : "Verify"} seed phrase`}
        onBack={handleBack}
        secondaryHeader={
          <View style={{ marginVertical: 16, alignItems: "center" }}>
            <ProgressBlobs steps={2} activeStep={activeStep} />
          </View>
        }
      />
      <Spacer h={24} />
      {activeStep === 0 ? (
        <CopySeedPhrase setActiveStep={setActiveStep} />
      ) : (
        <VerifySeedPhrase setActiveStep={setActiveStep} />
      )}
    </View>
  );
}

function CopySeedPhrase({
  setActiveStep,
}: {
  setActiveStep: (value: 0 | 1) => void;
}) {
  return (
    <View>
      <TextBody color={color.grayMid}>
        Your account will be backed up to the seed phrase, allowing you to
        recover it even if you lose your device.
      </TextBody>
      <Spacer h={24} />
      <SeedPhraseBox mode="read" />
      <Spacer h={24} />
      <ButtonBig
        type="primary"
        title="Continue"
        onPress={() => setActiveStep(1)}
      />
    </View>
  );
}

function VerifySeedPhrase({
  setActiveStep,
}: {
  setActiveStep: (value: 0 | 1) => void;
}) {
  return (
    <View>
      <TextBody color={color.grayDark}>
        Type your seed phrase into the input box.
      </TextBody>
      <Spacer h={24} />
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
