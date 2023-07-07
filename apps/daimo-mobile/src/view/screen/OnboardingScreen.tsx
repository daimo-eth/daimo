import { tokenMetadata } from "@daimo/contract";
import { Octicons } from "@expo/vector-icons";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { ReactNode, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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

import { useCreateAccount } from "../../action/useCreateAccount";
import {
  deleteEnclaveKey,
  useLoadAccountFromKey,
  useLoadKeyFromEnclave,
} from "../../logic/enclave";
import { rpcHook } from "../../logic/trpc";
import { defaultEnclaveKeyName, useAccount } from "../../model/account";
import { ButtonBig, ButtonSmall } from "../shared/Button";
import { InfoLink } from "../shared/InfoLink";
import { InputBig, OctName } from "../shared/Input";
import Spacer from "../shared/Spacer";
import { color, ss } from "../shared/style";
import {
  TextBody,
  TextCenter,
  TextError,
  TextH1,
  TextSmall,
} from "../shared/text";
import { comingSoon } from "../shared/underConstruction";

export default function OnboardingScreen() {
  const [page, setPage] = useState(1);
  const next = useCallback(() => setPage(page + 1), [page]);

  // See if we already have a key in the enclave
  const [, setAccount] = useAccount();
  const pubKey = useLoadKeyFromEnclave();
  const account = useLoadAccountFromKey(pubKey);
  useEffect(() => {
    if (account != null) setAccount(account);

    if (account === null) {
      // Null, not undefined = no account found for this pubkey
      // TODO: consider making this a UI to warn the user
      deleteEnclaveKey(defaultEnclaveKeyName);
    }
  }, [account]);

  return (
    <View style={styles.onboardingScreen}>
      {page === 1 && <IntroPages onCreateAccount={next} />}
      {page === 2 && <AllowNotifications onNext={next} />}
      {page === 3 && <CreateAccountPage />}
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
        <IntroPage title="Welcome to Daimo">
          <TextBody>
            Thanks for testing our alpha release. Daimo is experimental
            technology. Use at your own risk.
          </TextBody>
        </IntroPage>
        <IntroPage title={tokenMetadata.symbol}>
          <TextBody>
            Daimo lets you send and receive money using the{" "}
            {tokenMetadata.symbol} stablecoin. 1 {tokenMetadata.symbol} is $1.
          </TextBody>
          <InfoLink
            url="https://www.circle.com/en/usdc"
            title="Learn how it works here"
          />
        </IntroPage>
        <IntroPage title="Yours alone">
          <TextBody>
            Daimo stores money via cryptographic secrets. There's no bank. To
            protect your funds in case you lose your phone, you can add
            additional devices.
          </TextBody>
        </IntroPage>
        <IntroPage title="On Ethereum">
          <TextBody>
            Daimo runs on Base, an Ethereum rollup. This lets you send money
            securely, anywhere in the world, quickly, and at low cost.
          </TextBody>
          <InfoLink
            url="https://ethereum-magicians.org/t/a-rollup-centric-ethereum-roadmap/4698"
            title="Learn more about rollups"
          />
        </IntroPage>
      </ScrollView>
      <Spacer h={64} />
      <ButtonBig title="Create Account" onPress={onCreateAccount} />
      <Spacer h={8} />
      <ButtonSmall title="Use existing" onPress={comingSoon} />
    </View>
  );
}

function IntroPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.introPage}>
      <TextH1>{title}</TextH1>
      {children}
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

function AllowNotifications({ onNext }: { onNext: () => void }) {
  const requestPermission = async () => {
    if (!Device.isDevice) {
      window.alert("Push notifications unsupported in simulator.");
      return;
    }

    const status = await Notifications.requestPermissionsAsync();
    console.log(`[ONBOARDING] notifications request ${status.status}`);
    if (!status.granted) return;

    onNext();
  };

  return (
    <View style={styles.onboardingScreen}>
      <View style={styles.createAccountPage}>
        <TextH1>
          <Octicons name="bell" size={40} />
        </TextH1>
        <View style={ss.spacer.h32} />
        <View style={ss.container.ph16}>
          <TextBody>
            <TextCenter>
              You'll be notified only for account activity. For example, when
              you receive money.
            </TextCenter>
          </TextBody>
        </View>
        <View style={ss.spacer.h32} />
        <ButtonBig title="Allow Notifications" onPress={requestPermission} />
        <View style={ss.spacer.h16} />
        <ButtonSmall title="Skip" onPress={onNext} />
      </View>
    </View>
  );
}

function CreateAccountPage() {
  const [name, setName] = useState("");
  const { exec, status, message } = useCreateAccount(name);
  const createAccount = useCallback(() => status === "idle" && exec(), [exec]);

  return (
    <KeyboardAvoidingView behavior="padding">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.onboardingScreen}>
          <View style={styles.createAccountPage}>
            <TextH1>Welcome</TextH1>
            <View style={ss.spacer.h256}>
              {status === "idle" && (
                <NamePicker
                  name={name}
                  onChange={setName}
                  onChoose={createAccount}
                />
              )}
              {status === "loading" && <NameSpinner />}
            </View>
            <TextCenter>
              {status === "error" && <TextError>{message}</TextError>}
              {status !== "error" && <TextSmall>{message}</TextSmall>}
            </TextCenter>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

function NameSpinner() {
  return (
    <View style={ss.container.center}>
      <ActivityIndicator size="large" />
    </View>
  );
}

function NamePicker({
  name,
  onChange,
  onChoose,
}: {
  name: string;
  onChange: (name: string) => void;
  onChoose: () => void;
}) {
  let error = "";
  try {
    validateName(name);
  } catch (e: any) {
    error = e.message;
  }
  const result = rpcHook.resolveName.useQuery({ name }, { enabled: !error });

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
    <View>
      <View style={ss.spacer.h64} />
      <View>
        <InputBig
          placeholder="choose a name"
          value={name}
          onChange={onChange}
          center
        />
        <View style={ss.spacer.h8} />
        <TextSmall>
          <TextCenter>{status}</TextCenter>
        </TextSmall>
      </View>
      <View style={ss.spacer.h8} />
      <ButtonBig title="Create" onPress={onChoose} disabled={!isAvailable} />
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
    flexBasis: 280,
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
