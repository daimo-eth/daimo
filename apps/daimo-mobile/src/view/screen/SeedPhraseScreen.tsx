import Octicons from "@expo/vector-icons/Octicons";
import * as Clipboard from "expo-clipboard";
import { memo, useCallback, useMemo, useReducer, useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableHighlight,
  Pressable,
  ViewStyle,
} from "react-native";

import { useNav } from "../../common/nav";
import { ButtonBig } from "../shared/Button";
import { ProgressBlobs } from "../shared/ProgressBlobs";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { color, ss, touchHighlightUnderlay } from "../shared/style";
import { TextBody, TextBtnCaps } from "../shared/text";

const ARRAY_SIX = Array(6).fill(0);

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
        <VerifySeedPhrase />
      )}
    </View>
  );
}

function CopySeedPhrase({
  setActiveStep,
}: {
  setActiveStep: (value: 0 | 1) => void;
}) {
  const [saved, toggleSaved] = useReducer((s) => !s, false);

  return (
    <View>
      <TextBody color={color.grayMid}>
        Your account will be backed up to the seed phrase, allowing you to
        recover it even if you lose your device.
      </TextBody>
      <Spacer h={24} />
      <SeedPhraseBox mode="read" />
      <Spacer h={24} />
      <CopyToClipboard />
      <Spacer h={24} />
      <ConfirmPhraseSave saved={saved} toggleSaved={toggleSaved} />
      <Spacer h={24} />
      <ButtonBig
        type="primary"
        title="Continue"
        disabled={!saved}
        onPress={() => setActiveStep(1)}
      />
    </View>
  );
}

function CopyToClipboard() {
  const [justCopied, setJustCopied] = useState(false);

  const copy = useCallback(async () => {
    await Clipboard.setStringAsync("");
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1000);
  }, []);

  return (
    <View style={{ alignItems: "center" }}>
      <TouchableHighlight
        style={styles.copyButton}
        hitSlop={16}
        onPress={copy}
        {...touchHighlightUnderlay.subtle}
      >
        <>
          <Octicons
            name={justCopied ? "check-circle" : "copy"}
            size={16}
            color={color.primary}
          />
          <Spacer w={8} />
          <TextBtnCaps
            style={[ss.text.btnCaps, { textTransform: "uppercase" }]}
            color={color.primary}
          >
            COPY TO CLIPBOARD
          </TextBtnCaps>
        </>
      </TouchableHighlight>
    </View>
  );
}

function Checkbox({ active, toggle }: { active: boolean; toggle(): void }) {
  const boxStyle: ViewStyle = useMemo(
    () => ({
      width: 16,
      height: 16,
      borderRadius: 4,
      borderWidth: active ? 0 : 2,
      borderColor: color.primary,
      backgroundColor: active ? color.primary : color.white,
    }),
    [active]
  );

  return <Pressable style={boxStyle} onPress={toggle} />;
}

function ConfirmPhraseSave({
  saved,
  toggleSaved,
}: {
  saved: boolean;
  toggleSaved(): void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Checkbox active={saved} toggle={toggleSaved} />
      <Spacer w={4} />
      <TextBody color={color.grayMid}>
        I have saved my seed phrase in a secure location
      </TextBody>
    </View>
  );
}

function VerifySeedPhrase() {
  return (
    <View>
      <TextBody color={color.grayMid}>
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

  const renderCell = useCallback(
    (index: number) => (
      <SeedPhraseInput
        key={`${mode}-${index}`}
        mode={mode}
        value={state[index]}
        text=""
        num={index}
        onChangeText={(text) => handleInputChange(index, text)}
      />
    ),
    [mode, state]
  );

  return (
    <View style={styles.box}>
      <View style={styles.boxColumn}>
        {ARRAY_SIX.map((_, index) => renderCell(index + 1))}
      </View>
      <View style={styles.boxColumn}>
        {ARRAY_SIX.map((_, index) => renderCell(index + 7))}
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
        <TextInput
          style={styles.boxInput}
          value={value}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={onChangeText}
        />
      )}
    </View>
  );
}

const SeedPhraseInput = memo(BaseSeedPhraseInput);

type SeedPhraseInputState = Record<number, string>;
type SeedPhraseInputAction = { key: number; value: string };
type SeedPhraseInputReducer = (
  state: SeedPhraseInputState,
  action: SeedPhraseInputAction
) => SeedPhraseInputState;

function useSeedPhraseInput() {
  return useReducer<SeedPhraseInputReducer>(
    (state, next) => ({ ...state, [next.key]: next.value }),
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
  copyButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: "row",
    borderRadius: 4,
  },
});
