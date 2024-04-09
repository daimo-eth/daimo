import {
  SlotType,
  assertNotNull,
  findAccountUnusedSlot,
  generateMnemonicKey,
} from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import * as Clipboard from "expo-clipboard";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useState,
} from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  View,
  ViewStyle,
} from "react-native";
import { Hex } from "viem";

import { AddKeySlotButton } from "./keyRotation/AddKeySlotButton";
import { useNav } from "../../common/nav";
import { Account } from "../../model/account";
import { ButtonBig } from "../shared/Button";
import { ProgressBlobs } from "../shared/ProgressBlobs";
import { ScreenHeader } from "../shared/ScreenHeader";
import {
  SeedPhraseDisplay,
  SeedPhraseEntry,
  SeedPhraseInputAction,
  SeedPhraseInputState,
  useSeedPhraseInput,
} from "../shared/SeedPhraseDisplay";
import Spacer from "../shared/Spacer";
import { color, ss, touchHighlightUnderlay } from "../shared/style";
import { TextBody, TextBtnCaps } from "../shared/text";
import { useWithAccount } from "../shared/withAccount";

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
  const { words } = useSeedPhraseContext();

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <TextBody color={color.grayMid}>
        Your account will be backed up to the seed phrase, allowing you to
        recover it even if you lose your device.
      </TextBody>
      <Spacer h={24} />
      <SeedPhraseDisplay words={words} />
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
        I've saved this seed phrase securely
      </TextBody>
    </View>
  );
}

function VerifySeedPhraseInner({ account }: { account: Account }) {
  const nav = useNav();
  const { isValid, publicKey, state, dispatch } = useSeedPhraseContext();

  const seedPhraseSlot = useMemo(
    () => findAccountUnusedSlot(account, SlotType.SeedPhraseBackup),
    []
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <TextBody color={color.grayMid}>
        Type your seed phrase into the input box.
      </TextBody>
      <Spacer h={24} />
      <SeedPhraseEntry {...{ state, dispatch }} />
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
  const Inner = useWithAccount(VerifySeedPhraseInner);
  return <Inner />;
};

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
  // Generate a seed phrase
  const { mnemonic, publicKeyDER } = useMemo(generateMnemonicKey, []);
  const words = useMemo(() => mnemonic.split(" "), [mnemonic]);

  // Have the user enter a few words, to verify they recorded it correctly
  const indices = [1, 2, 11, 12];
  const [state, dispatch] = useSeedPhraseInput(indices);

  const isValid = !state.some((v, i) => v !== words[i - 1]);

  return (
    <SeedPhraseContext.Provider
      value={{
        state,
        dispatch,
        mnemonic,
        words,
        publicKey: publicKeyDER,
        isValid,
      }}
    >
      {children}
    </SeedPhraseContext.Provider>
  );
}

function useSeedPhraseContext() {
  const seedPhraseContext = useContext(SeedPhraseContext);
  return assertNotNull(seedPhraseContext, "Must be used in SeedPhraseProvider");
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.white,
    paddingHorizontal: 24,
  },
  copyButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: "row",
    borderRadius: 4,
  },
});
