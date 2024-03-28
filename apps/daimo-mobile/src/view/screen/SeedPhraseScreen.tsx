import { memo, useCallback, useReducer, useState } from "react";
import { View, StyleSheet, TextInput, TextInputProps } from "react-native";

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
    <View style={styles.screen}>
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
  const [state, dispatch] = useSeedPhraseInput();

  const handleInputChange = (index: number, text: string) => {
    dispatch({ key: index, value: text });
  };

  return (
    <View style={styles.box}>
      <View style={styles.boxColumn}>
        {Array(6)
          .fill(0)
          .map((_, index) => (
            <SeedPhraseInput
              mode={mode}
              value={state[index + 1]}
              text=""
              num={index + 1}
              onChangeText={(text) => handleInputChange(index + 1, text)}
            />
          ))}
      </View>
      <View style={styles.boxColumn}>
        {Array(6)
          .fill(0)
          .map((_, index) => (
            <SeedPhraseInput
              mode={mode}
              value={state[index + 7]}
              text=""
              num={index + 7}
              onChangeText={(text) => handleInputChange(index + 7, text)}
            />
          ))}
      </View>
    </View>
  );
}

function BaseSeedPhraseInput({
  mode,
  value,
  text,
  num,
  onChangeText,
}: {
  mode: "read" | "edit";
  value: string;
  text: string;
  num: number;
  onChangeText(text: string): void;
}) {
  return (
    <View style={styles.boxInputWrapper}>
      <TextBody color={color.grayLight}>{num}</TextBody>
      <Spacer w={8} />
      {mode === "read" ? (
        <TextBody>{text}</TextBody>
      ) : (
        <SeedPhraseTextInput value={value} onChangeText={onChangeText} />
      )}
    </View>
  );
}

const SeedPhraseInput = memo(BaseSeedPhraseInput);

function SeedPhraseTextInput({ value, onChangeText }: TextInputProps) {
  return (
    <TextInput
      style={styles.boxInput}
      value={value}
      autoCapitalize="none"
      autoCorrect={false}
      onChangeText={onChangeText}
    />
  );
}

type SeedPhraseInputState = Record<number, string>;
type SeedPhraseInputAction = { key: number; value: string };
type SeedPhraseInputReducer = (
  state: SeedPhraseInputState,
  action: SeedPhraseInputAction
) => SeedPhraseInputState;

function useSeedPhraseInput() {
  return useReducer<SeedPhraseInputReducer>(
    (state, next) => {
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
  screen: {
    flex: 1,
    backgroundColor: color.white,
    paddingHorizontal: 24,
  },
  box: {
    borderWidth: 1,
    borderColor: color.grayLight,
    borderRadius: 8,
    flexDirection: "row",
    gap: 24,
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: color.white,
    ...ss.container.shadow,
  },
  boxColumn: {
    flex: 1,
  },
  boxInputWrapper: {
    flexDirection: "row",
    borderBottomColor: color.grayLight,
    borderBottomWidth: 2,
    marginBottom: 8,
    paddingVertical: 4,
  },
  boxInput: {
    flex: 1,
    ...ss.text.body,
  },
});
