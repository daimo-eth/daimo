import Octicons from "@expo/vector-icons/Octicons";
import { useRoute } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";

import { OnboardingHeader } from "./OnboardingHeader";
import {
  ParamListOnboarding,
  useExitBack,
  useOnboardingNav,
} from "../../../common/nav";
import { i18n } from "../../../i18n";
import { requestEnclaveSignature } from "../../../logic/key";
import { NamedError } from "../../../logic/log";
import { defaultEnclaveKeyName } from "../../../storage/account";
import { ButtonBig } from "../../shared/Button";
import Spacer from "../../shared/Spacer";
import { TextBody, TextCenter, TextError } from "../../shared/text";
import { useTheme } from "../../style/theme";

type Props = NativeStackScreenProps<
  ParamListOnboarding,
  "CreateSetupKey" | "ExistingSetupKey"
>;
const i18 = i18n.onboardingSetupKey;
export function OnboardingSetupKeyScreen(props: Props) {
  const { color, ss } = useTheme();

  const [loading, setLoading] = useState(false);
  const [askToSetPin, setAskToSetPin] = useState(false);
  const [error, setError] = useState("");

  const nav = useOnboardingNav();
  const route = useRoute();
  const isCreatingAccount = route.name === "CreateSetupKey";

  // Nav
  const onNext = () => {
    const currentRoute = route.name;
    console.log(`[ONBOARDING] leaving SetupKeyPage, route ${currentRoute}`);
    if (currentRoute === "CreateSetupKey") {
      const { inviteLink } = props.route.params!;
      nav.navigate("CreateChooseName", { inviteLink });
    } else if (currentRoute === "ExistingSetupKey") {
      nav.navigate("Existing");
    } else throw new Error("Unknown SetupKeyPage route " + currentRoute);
  };
  const onPrev = useExitBack();

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

  // If we're in the onboarding flow, show progress bar
  const progress = isCreatingAccount ? { steps: 4, activeStep: 1 } : {};

  return (
    <View>
      <OnboardingHeader
        title={i18.screenHeader()}
        onPrev={onPrev}
        {...progress}
      />
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
              <TextBody>{i18.pin.generateDescription()}</TextBody>
            )}
            {askToSetPin && <TextBody>{i18.pin.failedDescription()}</TextBody>}
          </TextCenter>
        </View>
        <Spacer h={118} />
        {loading && <ActivityIndicator size="large" />}
        {!loading && (
          <ButtonBig
            type="primary"
            title={
              askToSetPin ? i18.pin.tryAgainButton() : i18.pin.generateButton()
            }
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

const styles = StyleSheet.create({
  paddedPage: {
    paddingTop: 36,
    paddingHorizontal: 24,
  },
});
