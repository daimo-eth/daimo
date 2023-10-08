import { assertNotNull, validateName } from "@daimo/common";
import { tokenMetadata } from "@daimo/contract";
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
import QRCode from "react-native-qrcode-svg";

import { ActStatus } from "../../action/actStatus";
import { useCreateAccount } from "../../action/useCreateAccount";
import { useExistingAccount } from "../../action/useExistingAccount";
import { requestEnclaveSignature } from "../../action/useSendAsync";
import { createAddDeviceString } from "../../logic/device";
import { NamedError } from "../../logic/log";
import { rpcHook } from "../../logic/trpc";
import { defaultEnclaveKeyName } from "../../model/account";
import { ButtonBig, ButtonSmall } from "../shared/Button";
import { InfoLink } from "../shared/InfoLink";
import { InputBig, OctName } from "../shared/InputBig";
import Spacer from "../shared/Spacer";
import image from "../shared/image";
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
  const [page, setPage] = useState<OnboardPage>("intro");
  const pageStack = useRef([] as OnboardPage[]).current;
  const goTo = (newPage: OnboardPage) => {
    pageStack.push(page);
    setPage(newPage);
  };
  const goToPrev = useCallback(
    () => pageStack.length > 0 && setPage(pageStack.pop()!),
    []
  );
  const next = getNext(page, goTo, onOnboardingComplete); // , [page]);
  const prev = pageStack.length === 0 ? undefined : goToPrev;

  // User enters their name
  // TODO: consider splitting into components and just using StackNavigation
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
        </IntroPage>
      </ScrollView>
      <Spacer h={64} />
      <ButtonBig
        type="primary"
        title="Create Account"
        onPress={() => {
          onNext("create");
        }}
      />
      <Spacer h={8} />
      <ButtonSmall
        title="Use existing"
        onPress={() => {
          onNext("existing");
        }}
      />
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
  return <View style={{ flexDirection: "row" }}>{bubbles}</View>;
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
      <View style={styles.onboardingScreen}>
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
                  Authentication failed. Does your phone have a secure lock
                  screen set up? You'll need one to secure your Daimo account.
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
      <OnboardingFooter />
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
    <View style={styles.onboardingScreen}>
      <View style={styles.createAccountPage}>
        <TextH1>
          <Octicons name="bell" size={40} />
        </TextH1>
        <Spacer h={32} />
        <View style={ss.container.padH16}>
          <TextCenter>
            <TextBody>
              You'll be notified only for account activity. For example, when
              you receive money.
            </TextBody>
          </TextCenter>
        </View>
        <Spacer h={32} />
        <ButtonBig
          type="primary"
          title="Allow Notifications"
          onPress={requestPermission}
        />
        <Spacer h={16} />
        <ButtonSmall title="Skip" onPress={onNext} />
      </View>
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
        <View style={styles.onboardingScreen}>
          <View style={styles.createAccountPage}>
            <TextH1>Welcome</TextH1>
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
        <OnboardingFooter />
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
      <View style={styles.onboardingScreen}>
        <View style={styles.useExistingPage}>
          <TextH1>Welcome</TextH1>
          <Spacer h={32} />
          <TextCenter>
            <TextBody>
              Scan QR code from the Settings page of existing device
            </TextBody>
          </TextCenter>
          <Spacer h={32} />
          <View style={styles.vertQR}>
            <QRCode
              value={createAddDeviceString(pubKeyHex)}
              color={color.grayDark}
              size={256}
              logo={{ uri: image.qrLogo }}
              logoSize={72}
            />
          </View>
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
      <OnboardingFooter />
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
    <View style={styles.onboardingHeaderFooter}>
      <View style={styles.onboardingBackWrap}>
        <ButtonSmall onPress={onPrev}>
          <View style={styles.onboardingBack}>
            {onPrev && (
              <>
                <Octicons
                  name="chevron-left"
                  size={20}
                  color={color.midnight}
                />
                <Text style={styles.onboardingBackText}>Back</Text>
              </>
            )}
            {!onPrev && " "}
          </View>
        </ButtonSmall>
      </View>
    </View>
  );
}

function OnboardingFooter() {
  /* Ensure header and footer are equal height to correctly center content. */
  return <View style={styles.onboardingHeaderFooter} />;
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
      <Spacer h={64} />
      <InputBig
        placeholder="choose a username"
        value={name}
        onChange={onChange}
        center
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
    backgroundColor: color.white,
    alignItems: "center",
    justifyContent: "space-around",
  },
  onboardingHeaderFooter: {
    height: 64,
    marginTop: 48,
  },
  onboardingBackWrap: {
    width: 128,
    paddingLeft: 16,
  },
  onboardingBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 32,
  },
  onboardingBackText: {
    ...ss.text.h3,
    color: color.midnight,
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
  namePickerWrap: {
    height: 256,
  },
  useExistingPage: {
    width: screenDimensions.width,
    padding: 32,
  },
  vertQR: {
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
});
