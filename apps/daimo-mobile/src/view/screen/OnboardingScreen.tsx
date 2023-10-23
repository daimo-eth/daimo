import { assertNotNull, validateName } from "@daimo/common";
import { chainConfig } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { QRCodeBox } from "./QRScreen";
import { ActStatus } from "../../action/actStatus";
import { useCreateAccount } from "../../action/useCreateAccount";
import { useExistingAccount } from "../../action/useExistingAccount";
import { requestEnclaveSignature } from "../../action/useSendAsync";
import { createAddDeviceString } from "../../logic/device";
import { NamedError } from "../../logic/log";
import { rpcHook } from "../../logic/trpc";
import { defaultEnclaveKeyName } from "../../model/account";
import { ButtonBig } from "../shared/Button";
import { InfoBubble } from "../shared/InfoBubble";
import { InfoLink } from "../shared/InfoLink";
import { InputBig, OctName } from "../shared/InputBig";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { color, ss } from "../shared/style";
import {
  EmojiToOcticon,
  TextBody,
  TextCenter,
  TextError,
  TextH1,
  TextLight,
} from "../shared/text";

type OnboardPage =
  | "intro"
  | "create-try-enclave"
  | "existing-try-enclave"
  | "create"
  | "existing"
  | "new-allow-notifications"
  | "existing-allow-notifications"
  | "new-loading";

export default function OnboardingScreen({
  onOnboardingComplete,
}: {
  onOnboardingComplete: () => void;
}) {
  // Navigation with a back button
  // TODO: consider splitting into components and just using StackNavigation
  const [page, setPage] = useState<OnboardPage>("intro");
  const pageStack = useRef([] as OnboardPage[]).current;
  const goTo = (newPage: OnboardPage) => {
    pageStack.push(page);
    setPage(newPage);
  };
  const goToPrev = () => pageStack.length > 0 && setPage(pageStack.pop()!);
  const next = getNext(page, goTo, onOnboardingComplete);
  const prev = pageStack.length === 0 ? undefined : goToPrev;

  // User enters their name
  const [name, setName] = useState("");

  // Create an account as soon as possible, hiding latency
  const {
    exec: createExec,
    status: createStatus,
    message: createMessage,
  } = useCreateAccount(name);

  return (
    <View style={styles.onboardingScreen}>
      {page === "intro" && <IntroPages onNext={next} />}
      {(page === "create-try-enclave" || page === "existing-try-enclave") && (
        <SetupKey onNext={next} onPrev={prev} createStatus={createStatus} />
      )}
      {page === "create" && (
        <CreateAccountPage
          onNext={next}
          onPrev={prev}
          name={name}
          setName={setName}
          exec={createExec}
          status={createStatus}
          message={createMessage}
        />
      )}
      {page === "existing" && <UseExistingPage onNext={next} onPrev={prev} />}
      {page === "new-allow-notifications" && (
        <AllowNotifications onNext={next} />
      )}
      {page === "existing-allow-notifications" && (
        <AllowNotifications onNext={next} />
      )}
      {page === "new-loading" && (
        <LoadingScreen
          loadingStatus={createStatus}
          loadingMessage={createMessage}
          onNext={next}
        />
      )}
    </View>
  );
}

function getNext(
  page: OnboardPage,
  goToPage: (p: OnboardPage) => void,
  onOnboardingComplete: () => void
): (choice?: "create" | "existing") => void {
  const fnGoTo = (p: OnboardPage) => () => goToPage(p);

  switch (page) {
    case "intro":
      return (choice?: "create" | "existing") => {
        // Android goes through an extra onboarding step
        if (Platform.OS !== "android") goToPage(assertNotNull(choice));
        else if (choice === "create") goToPage("create-try-enclave");
        else goToPage("existing-try-enclave");
      };
    case "create-try-enclave":
      return fnGoTo("create");
    case "existing-try-enclave":
      return fnGoTo("existing");
    case "create":
      return fnGoTo("new-allow-notifications");
    case "existing":
      return fnGoTo("existing-allow-notifications");
    case "new-allow-notifications":
      return fnGoTo("new-loading");
    case "existing-allow-notifications":
    case "new-loading":
      return onOnboardingComplete;
    default:
      throw new Error(`unreachable ${page}`);
  }
}

function IntroPages({
  onNext,
}: {
  onNext: (choice: "create" | "existing") => void;
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const updatePageBubble = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const page = Math.round(contentOffset.x / layoutMeasurement.width);
    setPageIndex(page);
  };

  const { tokenSymbol } = chainConfig;

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
          <TextParagraph>
            Daimo is a global payments app that runs on Ethereum.
          </TextParagraph>
        </IntroPage>
        <IntroPage title={tokenSymbol}>
          <TextParagraph>
            You can send and receive money using the {tokenSymbol} stablecoin. 1{" "}
            {tokenSymbol} is $1.
          </TextParagraph>
          <View style={ss.container.marginHNeg16}>
            <InfoLink
              url="https://www.circle.com/en/usdc"
              title="Learn how it works here"
            />
          </View>
        </IntroPage>
        <IntroPage title="Yours alone">
          <TextParagraph>
            Daimo stores money via cryptographic secrets. There's no bank.
          </TextParagraph>
        </IntroPage>
        <IntroPage title="On Ethereum">
          <TextParagraph>
            Daimo runs on Base, an Ethereum rollup. This lets you send money
            securely, anywhere in the world.
          </TextParagraph>
        </IntroPage>
      </ScrollView>
      <View style={styles.introButtonsWrap}>
        <ButtonBig
          type="primary"
          title="Create Account"
          onPress={() => onNext("create")}
        />
        <Spacer h={8} />
        <ButtonBig
          type="subtle"
          title="Use existing"
          onPress={() => onNext("existing")}
        />
      </View>
    </View>
  );
}

function TextParagraph({ children }: { children: ReactNode }) {
  return <Text style={styles.introText}>{children}</Text>;
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
      <TextCenter>
        <TextH1>{title}</TextH1>
      </TextCenter>
      <Spacer h={32} />
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
          backgroundColor: i === index ? color.midnight : color.grayLight,
          margin: 4,
        }}
      />
    );
  }
  return (
    <View style={{ flexDirection: "row", justifyContent: "center" }}>
      {bubbles}
    </View>
  );
}

function SetupKey({
  onNext,
  onPrev,
  createStatus,
}: {
  onNext: () => void;
  onPrev?: () => void;
  createStatus: ActStatus;
}) {
  const [loading, setLoading] = useState(false);
  const [askToSetPin, setAskToSetPin] = useState(false);
  const [error, setError] = useState("");

  const trySignatureGeneration = async () => {
    setLoading(true);
    try {
      await requestEnclaveSignature(
        defaultEnclaveKeyName,
        "dead",
        "Create account"
      );

      console.log(`[ONBOARDING] enclave signature trial success`);
      onNext();
    } catch (e: any) {
      console.error(e);
      if (e instanceof NamedError && e.name === "ExpoEnclaveSign") {
        setError(e.message);
      } else {
        setError("Unknown error");
      }

      // Auth failed. Possible user doesn't have proper auth set up.
      // TODO: In future, catch different errors differently.
      setAskToSetPin(true);
    }
    setLoading(false);
  };

  return (
    <View>
      <OnboardingHeader onPrev={onPrev} />
      <View style={styles.createAccountPage}>
        <TextH1>
          <Octicons name={askToSetPin ? "unlock" : "lock"} size={40} />
        </TextH1>
        <Spacer h={32} />
        <View style={ss.container.padH16}>
          <TextCenter>
            {!askToSetPin && (
              <TextBody>
                Generate your Daimo account. Your account is stored on your
                device, secured by cryptography.
              </TextBody>
            )}
            {askToSetPin && (
              <TextBody>
                Authentication failed. Does your phone have a secure lock screen
                set up? You'll need one to secure your Daimo account.
              </TextBody>
            )}
          </TextCenter>
        </View>
        <Spacer h={32} />
        {(loading || createStatus === "loading") && (
          <ActivityIndicator size="large" />
        )}
        {!loading && createStatus !== "loading" && (
          <ButtonBig
            type="primary"
            title={askToSetPin ? "Try again" : "Generate"}
            onPress={trySignatureGeneration}
          />
        )}
        {error && (
          <>
            <Spacer h={16} />
            <TextCenter>
              <TextError>{error}</TextError>
            </TextCenter>
          </>
        )}
      </View>
    </View>
  );
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
    <View style={styles.createAccountPage}>
      <TextCenter>
        <Octicons name="bell" size={32} />
      </TextCenter>
      <Spacer h={32} />
      <TextCenter>
        <TextParagraph>
          You'll be notified only for account activity. For example, when you
          receive money.
        </TextParagraph>
      </TextCenter>
      <Spacer h={32} />
      <ButtonBig
        type="primary"
        title="Allow Notifications"
        onPress={requestPermission}
      />
      <Spacer h={16} />
      <ButtonBig type="subtle" title="Skip" onPress={onNext} />
    </View>
  );
}

function CreateAccountPage({
  onNext,
  onPrev,
  name,
  setName,
  exec,
  status,
  message,
}: {
  onNext: () => void;
  onPrev?: () => void;
  name: string;
  setName: (name: string) => void;
  exec: () => void;
  status: ActStatus;
  message: string;
}) {
  const createAccount = useCallback(() => {
    if (status === "idle") {
      exec();
      console.log(`[ONBOARDING] create account ${name} ${status} ${message}`);
      onNext();
    }
  }, [exec]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View>
        <OnboardingHeader onPrev={onPrev} />
        <View style={styles.createAccountPage}>
          <View style={styles.namePickerWrap}>
            {status === "idle" && (
              <NamePicker
                name={name}
                onChange={setName}
                onChoose={createAccount}
              />
            )}
          </View>
          <TextCenter>
            {status === "error" && <TextError>{message}</TextError>}
            {status !== "error" && (
              <TextLight>
                <EmojiToOcticon size={16} text={message} />
              </TextLight>
            )}
          </TextCenter>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

function UseExistingPage({
  onNext,
  onPrev,
}: {
  onNext: () => void;
  onPrev?: () => void;
}) {
  const { status, message, pubKeyHex } = useExistingAccount();

  useEffect(() => {
    if (status === "success") onNext();
  }, [status]);

  if (pubKeyHex === undefined) return null;

  return (
    <View>
      <OnboardingHeader onPrev={onPrev} />
      <View style={styles.useExistingPage}>
        <InfoBubble
          title="Add this phone to an existing account"
          subtitle="Scan this QR code with your other device"
        />
        <Spacer h={32} />
        <QRCodeBox value={createAddDeviceString(pubKeyHex)} />
        <Spacer h={16} />
        <TextCenter>
          {status !== "error" && (
            <TextLight>
              <EmojiToOcticon size={16} text={message} />
            </TextLight>
          )}
        </TextCenter>
      </View>
    </View>
  );
}

function OnboardingHeader({ onPrev }: { onPrev?: () => void }) {
  /* On Android, listen for the native back button. */
  useEffect(() => {
    if (!onPrev) return;
    const onBack = () => {
      onPrev();
      return true;
    };
    BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => BackHandler.removeEventListener("hardwareBackPress", onBack);
  }, [onPrev]);

  return (
    <View style={ss.container.padH16}>
      <ScreenHeader title="Create Account" onBack={onPrev} />
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
    if (name.length === 0 || debounce) {
      return " "; // no error
    } else if (error) {
      return (
        <>
          {oct("alert")} {error.toLowerCase()}
        </>
      ); // invalid name
    } else if (result.isLoading) {
      return "..."; // name valid, loading
    } else if (result.error) {
      return <>{oct("alert")} offline?</>; // name valid, other error
    } else if (result.isSuccess && result.data) {
      return <>{oct("alert")} sorry, that name is taken</>; // name taken
    } else if (result.isSuccess && result.data === null) {
      isAvailable = true; // name valid & available
      return <>{oct("check-circle", color.successDark)} available</>;
    }
    throw new Error("unreachable");
  })();

  return (
    <View>
      <InputBig
        placeholder="choose a username"
        value={name}
        onChange={onChange}
        center
        autoFocus
      />
      <Spacer h={8} />
      <TextCenter>
        <TextLight>{status}</TextLight>
      </TextCenter>
      <Spacer h={8} />
      <ButtonBig
        type="primary"
        title="Create"
        onPress={onChoose}
        disabled={!isAvailable}
      />
    </View>
  );
}

function LoadingScreen({
  loadingStatus,
  loadingMessage,
  onNext,
}: {
  loadingStatus: ActStatus;
  loadingMessage: string;
  onNext: () => void;
}) {
  useEffect(() => {
    console.log(`[ONBOARDING] loading status ${loadingStatus}`);
    if (loadingStatus === "success") onNext();
  }, [loadingStatus]);

  return (
    <View style={ss.container.center}>
      <ActivityIndicator size="large" />
      <Spacer h={32} />
      <TextCenter>
        {loadingStatus === "error" && <TextError>{loadingMessage}</TextError>}
        {loadingStatus !== "error" && (
          <TextLight>
            <EmojiToOcticon size={16} text={loadingMessage} />
          </TextLight>
        )}
      </TextCenter>
    </View>
  );
}

const screenDimensions = Dimensions.get("screen");

const styles = StyleSheet.create({
  onboardingScreen: {
    flex: 1,
  },
  introPages: {
    flex: 1,
    backgroundColor: color.white,
    alignItems: "stretch",
    justifyContent: "center",
  },
  introPageScroll: {
    flexGrow: 0,
  },
  introPage: {
    width: screenDimensions.width,
    padding: 32,
  },
  introText: {
    ...ss.text.body,
    lineHeight: 24,
  },
  introButtonsWrap: {
    paddingHorizontal: 24,
  },
  namePickerWrap: {
    height: 168,
  },
  createAccountPage: {
    paddingTop: 128,
    paddingHorizontal: 24,
  },
  useExistingPage: {
    paddingHorizontal: 24,
  },
});
