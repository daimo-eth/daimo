import { SlotType, findUnusedSlot } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import * as Clipboard from "expo-clipboard";
import {
  ReactNode,
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useState,
} from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableHighlight,
  Pressable,
  ViewStyle,
  ScrollView,
} from "react-native";
import { Hex } from "viem";

import { AddKeySlotButton } from "./keyRotation/AddKeySlotButton";
import { useNav } from "../../common/nav";
import { generateSeedPhrase } from "../../logic/seedPhrase";
import { Account } from "../../model/account";
import { ButtonBig } from "../shared/Button";
import { ProgressBlobs } from "../shared/ProgressBlobs";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { color, ss, touchHighlightUnderlay } from "../shared/style";
import { TextBody, TextBtnCaps } from "../shared/text";
import { useWithAccount } from "../shared/withAccount";

const ARRAY_TWELVE = Array(12).fill(0);

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
    <SeedPhraseProvider>
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
    </SeedPhraseProvider>
  );
}

function CopySeedPhrase({
  setActiveStep,
}: {
  setActiveStep: (value: 0 | 1) => void;
}) {
  const [saved, toggleSaved] = useReducer((s) => !s, false);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
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
    </ScrollView>
  );
}

function CopyToClipboard() {
  const { mnemonic } = useSeedPhraseContext();
  const [justCopied, setJustCopied] = useState(false);

  const copy = useCallback(async () => {
    await Clipboard.setStringAsync(mnemonic);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1000);
  }, [mnemonic]);

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

function BaseVerifySeedPhrase({ account }: { account: Account }) {
  const nav = useNav();
  const { isValid, publicKey } = useSeedPhraseContext();

  const seedPhraseSlot = useMemo(
    () =>
      findUnusedSlot(
        account.accountKeys.map((k) => k.slot),
        SlotType.SeedPhraseBackup
      ),
    []
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <TextBody color={color.grayMid}>
        Type your seed phrase into the input box.
      </TextBody>
      <Spacer h={24} />
      <SeedPhraseBox mode="edit" />
      <Spacer h={24} />
      <AddKeySlotButton
        buttonTitle="Finish Setup"
        account={account}
        slot={seedPhraseSlot}
        knownPubkey={publicKey}
        disabled={!isValid}
        onSuccess={() => nav.goBack()}
      />
    </ScrollView>
  );
}

const VerifySeedPhrase = () => {
  const Inner = useWithAccount(BaseVerifySeedPhrase);

  return <Inner />;
};

function SeedPhraseBox({ mode }: { mode: "read" | "edit" }) {
  const { state, dispatch, words } = useSeedPhraseContext();

  const handleInputChange = (index: number, text: string) => {
    dispatch({ key: index, value: text });
  };

  const renderCell = useCallback(
    (index: number) => (
      <SeedPhraseCell
        key={`${mode}-${index}`}
        mode={mode}
        value={state[index]}
        text={words[index - 1]}
        num={index}
        onChangeText={(text) => handleInputChange(index, text)}
      />
    ),
    [mode, state, words]
  );

  return (
    <View style={styles.box}>
      <View style={styles.boxColumn}>
        {ARRAY_TWELVE.map((_, index) => renderCell(index + 1))}
      </View>
      <View style={styles.boxColumn}>
        {ARRAY_TWELVE.map((_, index) => renderCell(index + 13))}
      </View>
    </View>
  );
}

function BaseSeedPhraseCell({
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
      <View style={{ width: 24 }}>
        <TextBody color={color.gray3}>{num}</TextBody>
      </View>
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

const SeedPhraseCell = memo(BaseSeedPhraseCell);

type SeedPhraseInputState = Record<number, string>;
type SeedPhraseInputAction = { key: number; value: string };
type SeedPhraseInputReducer = (
  state: SeedPhraseInputState,
  action: SeedPhraseInputAction
) => SeedPhraseInputState;

function getInitialState() {
  const map: Record<number, string> = {};

  for (let i = 0; i < 24; i++) map[i + 1] = "";

  return map;
}

function useSeedPhraseInput() {
  return useReducer<SeedPhraseInputReducer>(
    (state, next) => ({ ...state, [next.key]: next.value }),
    getInitialState()
  );
}

type SeedPhraseContextValue = {
  state: SeedPhraseInputState;
  dispatch: React.Dispatch<SeedPhraseInputAction>;
  mnemonic: string;
  words: string[];
  publicKey: Hex;
  isValid: boolean;
};

const SeedPhraseContext = createContext<SeedPhraseContextValue | null>(null);

function SeedPhraseProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useSeedPhraseInput();
  const { mnemonic, publicKey } = useMemo(() => generateSeedPhrase(), []);

  const words = useMemo(() => mnemonic.split(" "), [mnemonic]);

  const enteredPhrase = useMemo(() => {
    return Object.values(state).join(" ");
  }, [state]);

  const isValid = enteredPhrase === mnemonic;

  return (
    <SeedPhraseContext.Provider
      value={{ state, dispatch, mnemonic, words, publicKey, isValid }}
    >
      {children}
    </SeedPhraseContext.Provider>
  );
}

function useSeedPhraseContext() {
  const seedPhraseContext = useContext(SeedPhraseContext);

  if (!seedPhraseContext) {
    throw new Error("Must be used inside a SeedPhraseProvider");
  }

  return seedPhraseContext;
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
    alignItems: "center",
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
