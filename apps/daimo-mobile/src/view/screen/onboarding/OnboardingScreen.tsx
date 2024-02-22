import { DaimoLink, assertNotNull, getInvitePasteLink } from "@daimo/common";
import { DaimoChain } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import { addEventListener } from "expo-linking";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";

import { AllowNotificationsPage } from "./AllowNotificationsPage";
import { CreateAccountPage } from "./CreateAccountPage";
import { IntroPages } from "./IntroPages";
import { InvitePage } from "./InvitePage";
import { OnboardingHeader } from "./OnboardingHeader";
import { UseExistingPage } from "./UseExistingPage";
import { ActStatus } from "../../../action/actStatus";
import { useAccountKey, useDeviceAttestationKey } from "../../../action/key";
import { useCreateAccount } from "../../../action/useCreateAccount";
import { useExistingAccount } from "../../../action/useExistingAccount";
import { getInitialURLOrTag } from "../../../logic/deeplink";
import { requestEnclaveSignature } from "../../../logic/key";
import { NamedError } from "../../../logic/log";
import { defaultEnclaveKeyName } from "../../../model/account";
import { ButtonBig } from "../../shared/Button";
import Spacer from "../../shared/Spacer";
import { color, ss } from "../../shared/style";
import {
  EmojiToOcticon,
  TextBody,
  TextCenter,
  TextError,
  TextLight,
} from "../../shared/text";

type OnboardPage =
  | "intro"
  | "create-invite"
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
  const [daimoChain, setDaimoChain] = useState<DaimoChain>("base");

  const next = getNext(page, goTo, setDaimoChain, onOnboardingComplete);
  const prev = pageStack.length === 0 ? undefined : goToPrev;
  // User enters their name
  const [name, setName] = useState("");

  const [inviteLink, setInviteLink] = useState<DaimoLink>();

  const processLink = (url: string) => {
    const recievedLink = getInvitePasteLink(url);
    if (recievedLink == null) return;

    setInviteLink(recievedLink);
  };

  // During onboarding, listen for payment or invite link invites
  useEffect(() => {
    getInitialURLOrTag(true).then((url) => {
      if (url == null) return;
      processLink(url);
    });

    const subscription = addEventListener("url", ({ url }) => processLink(url));

    return () => subscription.remove();
  }, []);

  const keyStatus = useAccountKey();

  const deviceAttestationKeyStatus = useDeviceAttestationKey();

  // Create an account as soon as possible, hiding latency
  const {
    exec: createExec,
    reset: createReset,
    status: createStatus,
    message: createMessage,
  } = useCreateAccount(
    name,
    inviteLink,
    daimoChain,
    keyStatus,
    deviceAttestationKeyStatus
  );

  // Use existing account spin loops and waits for the device key to show up
  // in any on-chain account.
  const startedCreating = page === "create" || page.startsWith("new-");

  const { status: useExistingStatus, message: useExistingMessage } =
    useExistingAccount(daimoChain, keyStatus, startedCreating);

  const existingNext = getNext(
    "existing",
    goTo,
    setDaimoChain,
    onOnboardingComplete
  );

  const reset = () => {
    pageStack.length = 0;
    goTo("intro");
    setName("");
    setInviteLink(undefined);
    createReset && createReset();
  };

  return (
    <View style={styles.onboardingScreen}>
      {page === "intro" && (
        <IntroPages
          useExistingStatus={useExistingStatus}
          keyStatus={keyStatus}
          existingNext={existingNext}
          onNext={next}
        />
      )}
      {page === "create-invite" && (
        <InvitePage
          onNext={next}
          onPrev={prev}
          daimoChain={daimoChain}
          inviteLink={inviteLink}
          setInviteLink={setInviteLink}
        />
      )}
      {(page === "create-try-enclave" || page === "existing-try-enclave") && (
        <SetupKeyPage onNext={next} onPrev={prev} createStatus={createStatus} />
      )}
      {page === "create" && (
        <CreateAccountPage
          onNext={next}
          onPrev={prev}
          name={name}
          setName={setName}
          daimoChain={daimoChain}
          exec={createExec}
          status={createStatus}
          message={createMessage}
        />
      )}
      {page === "existing" && (
        <UseExistingPage
          useExistingStatus={useExistingStatus}
          useExistingMessage={useExistingMessage}
          keyStatus={keyStatus}
          onNext={next}
          onPrev={prev}
          daimoChain={daimoChain}
        />
      )}
      {page === "new-allow-notifications" && (
        <AllowNotificationsPage onNext={next} />
      )}
      {page === "existing-allow-notifications" && (
        <AllowNotificationsPage onNext={next} />
      )}
      {page === "new-loading" && (
        <CreateAccountSpinnerPage
          loadingStatus={createStatus}
          loadingMessage={createMessage}
          onNext={next}
          onRetry={reset}
        />
      )}
    </View>
  );
}

function getNext(
  page: OnboardPage,
  goToPage: (p: OnboardPage) => void,
  setDaimoChain: (daimoChain: DaimoChain) => void,
  onOnboardingComplete: () => void
): ({
  choice,
  isTestnet,
}?: {
  choice?: "create" | "existing";
  isTestnet?: boolean;
}) => void {
  const fnGoTo = (p: OnboardPage) => () => goToPage(p);
  switch (page) {
    case "intro":
      return (input) => {
        const { choice } = assertNotNull(input);
        // Android goes through an extra onboarding step
        if (choice === "create") goToPage("create-invite");
        else {
          // Use existing
          if (Platform.OS !== "android") goToPage("existing");
          else goToPage("existing-try-enclave");
        }
      };
    case "create-invite":
      return (input) => {
        const { isTestnet } = assertNotNull(input);
        setDaimoChain(assertNotNull(isTestnet) ? "baseSepolia" : "base");

        if (Platform.OS !== "android") goToPage("create");
        else goToPage("create-try-enclave");
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

function SetupKeyPage({
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
      <OnboardingHeader title="Set up device" onPrev={onPrev} />
      <View style={styles.paddedPage}>
        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <Octicons
            name={askToSetPin ? "unlock" : "lock"}
            size={40}
            color={color.midnight}
          />
        </View>
        <Spacer h={24} />
        <View style={ss.container.padH16}>
          <TextCenter>
            {!askToSetPin && (
              <TextBody>
                Generate your Daimo device key. This key is generated and stored
                on your device, and secures access to your Daimo account.
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
        <Spacer h={118} />
        {(loading || createStatus === "loading") && (
          <ActivityIndicator size="large" />
        )}
        {!loading && createStatus !== "loading" && (
          <ButtonBig
            type="primary"
            title={askToSetPin ? "Try again" : "Generate"}
            onPress={trySignatureGeneration}
            showBiometricIcon={Platform.OS === "android" && !askToSetPin}
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

function CreateAccountSpinnerPage({
  loadingStatus,
  loadingMessage,
  onNext,
  onRetry,
}: {
  loadingStatus: ActStatus;
  loadingMessage: string;
  onNext: () => void;
  onRetry: () => void;
}) {
  useEffect(() => {
    console.log(`[ONBOARDING] loading status ${loadingStatus}`);
    if (loadingStatus === "success") onNext();
  }, [loadingStatus]);

  return (
    <View style={ss.container.center}>
      {loadingStatus !== "error" && <ActivityIndicator size="large" />}
      {loadingStatus === "error" && (
        <ButtonBig title="Retry" onPress={onRetry} type="primary" />
      )}
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

const styles = StyleSheet.create({
  onboardingScreen: {
    flex: 1,
  },
  paddedPage: {
    paddingTop: 64,
    paddingHorizontal: 24,
  },
});
