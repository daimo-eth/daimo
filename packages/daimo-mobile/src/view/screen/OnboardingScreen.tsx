import { Octicons } from "@expo/vector-icons";
import { useCallback, useContext, useEffect, useState } from "react";
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { useAccount } from "../../logic/account";
import { ChainContext } from "../../logic/chain";
import { trpc } from "../../logic/trpc";
import { ButtonBig, ButtonSmall } from "../shared/Button";
import { InputBig, OctName } from "../shared/Input";
import Spacer from "../shared/Spacer";
import { color, ss } from "../shared/style";
import { TextCenter, TextH1, TextSmall } from "../shared/text";
import { comingSoon } from "../shared/underConstruction";

export default function OnboardingScreen() {
  const { chain } = useContext(ChainContext);

  const [account, setAccount] = useAccount();

  const [isConfiguring, setIsConfiguring] = useState(false);
  const configure = useCallback(() => setIsConfiguring(true), []);

  const createAccount = useCallback(
    async (name: string) => {
      const account = await chain.createAccount(name);
      setAccount(account);
    },
    [account]
  );

  return (
    <View style={styles.onboardingScreen}>
      {!isConfiguring && <IntroPages onCreateAccount={configure} />}
      {isConfiguring && (
        <KeyboardAvoidingView behavior="padding">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.onboardingScreen}>
              <CreateAccountPage onCreateAccount={createAccount} />
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

function IntroPages({ onCreateAccount }: { onCreateAccount: () => void }) {
  const [pageIndex, setPageIndex] = useState(0);
  const updatePageBubble = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const page = Math.round(contentOffset.x / layoutMeasurement.width);
    setPageIndex(page);
  };

  return (
    <View style={styles.introPages}>
      <PageBubble count={4} index={pageIndex} />
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.introPageScroll}
        onScroll={updatePageBubble}
        scrollEventThrottle={32}
      >
        <IntroPage
          title="Welcome to Daimo"
          body="Thanks for testing our alpha release. Daimo is experimental
            technology. Use at your own risk."
        />
        <IntroPage
          title="USDC"
          body="Daimo lets you send and receive money using the USDC stablecoin.
            1 USDC is $1. Learn how it works here."
        />
        <IntroPage
          title="Yours alone"
          body="Daimo stores money via cryptographic secrets. There's no bank.
            To protect your funds in case you lose your phone, you can add
            additional devices."
        />
        <IntroPage
          title="On Ethereum"
          body="Daimo runs on Base, an Ethereum rollup. This lets you send
            money securely, anywhere in the world, quickly, and at low cost."
        />
      </ScrollView>
      <Spacer h={64} />
      <ButtonBig title="Create Account" onPress={onCreateAccount} />
      <Spacer h={8} />
      <ButtonSmall title="Use existing" onPress={comingSoon} />
    </View>
  );
}

function IntroPage({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.introPage}>
      <TextH1>{title}</TextH1>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

function PageBubble({ count, index }: { count: number; index: number }) {
  const bubbles = [];
  for (let i = 0; i < count; i++) {
    bubbles.push(
      <View
        key={i}
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: i === index ? "#000" : "#ccc",
          margin: 4,
        }}
      />
    );
  }
  return <View style={{ flexDirection: "row" }}>{bubbles}</View>;
}

function CreateAccountPage({
  onCreateAccount,
}: {
  onCreateAccount: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const create = useCallback(() => onCreateAccount(name), [name]);

  let error = "";
  try {
    validateName(name);
  } catch (e) {
    error = e.message;
  }
  const result = trpc.resolveName.useQuery({ name }, { enabled: !error });

  const [debounce, setDebounce] = useState(false);
  useEffect(() => {
    setDebounce(true);
    const t = setTimeout(() => setDebounce(false), 500);
    return () => clearTimeout(t);
  }, [name]);

  let isAvailable = false;
  const oct = (name: OctName, color?: string) => (
    <Octicons {...{ name, color }} size={14} />
  );
  const status = (function () {
    if (error === "Too short" || debounce) {
      return " "; // no error
    } else if (error) {
      return error; // entered an invalid username
    } else if (result.isLoading) {
      return "..."; // name valid, loading
    } else if (result.error) {
      return <>{oct("alert")} offline?</>; // name valid, error
    } else if (result.isSuccess && result.data) {
      return <>{oct("alert")} sorry, that name is taken</>; // name taken
    } else if (result.isSuccess && result.data === null) {
      isAvailable = true; // name valid & available
      return <>{oct("check-circle", color.status.green)} available</>;
    }
    throw new Error("unreachable");
  })();

  return (
    <View style={styles.createAccountPage}>
      <TextH1>Welcome</TextH1>
      <View style={ss.spacer.h64} />
      <View>
        <InputBig
          placeholder="choose a name"
          value={name}
          onChange={setName}
          center
        />
        <View style={ss.spacer.h8} />
        <TextSmall>
          <TextCenter>{status}</TextCenter>
        </TextSmall>
      </View>
      <View style={ss.spacer.h8} />
      <ButtonBig title="Create" onPress={create} disabled={!isAvailable} />
    </View>
  );
}

// TODO: import, use turborepo
function validateName(name: string): string {
  if (name.length < 3) throw new Error("Too short");
  if (name.length > 32) throw new Error("Too long");
  if (!/^[a-z][a-z0-9]{2,31}$/.test(name))
    throw new Error("Lowercase letters and numbers only");
  return name;
}

const screenDimensions = Dimensions.get("screen");

const styles = StyleSheet.create({
  onboardingScreen: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "space-around",
  },
  introPages: {
    alignItems: "center",
  },
  introPageScroll: {
    flexBasis: 256,
    flexGrow: 0,
  },
  introPage: {
    width: screenDimensions.width,
    gap: 32,
    padding: 32,
  },
  body: {
    ...ss.text.body,
    width: "100%",
    textAlign: "center",
  },
  createAccountPage: {
    width: screenDimensions.width,
    padding: 32,
  },
});
