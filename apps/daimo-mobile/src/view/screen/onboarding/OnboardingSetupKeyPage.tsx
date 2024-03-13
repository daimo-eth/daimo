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
import { requestEnclaveSignature } from "../../../logic/key";
import { NamedError } from "../../../logic/log";
import { defaultEnclaveKeyName } from "../../../model/account";
import { ButtonBig } from "../../shared/Button";
import Spacer from "../../shared/Spacer";
import { color, ss } from "../../shared/style";
import { TextBody, TextCenter, TextError } from "../../shared/text";

type Props = NativeStackScreenProps<
  ParamListOnboarding,
  "CreateSetupKey" | "ExistingSetupKey"
>;
export function OnboardingSetupKeyPage(props: Props) {
  const [loading, setLoading] = useState(false);
  const [askToSetPin, setAskToSetPin] = useState(false);
  const [error, setError] = useState("");

  const nav = useOnboardingNav();
  const route = useRoute();
  const onNext = () => {
    const currentRoute = route.name;
    console.log(`[ONBOARDING] leaving SetupKeyPage, route ${currentRoute}`);
    if (currentRoute === "CreateSetupKey") {
      const { inviteLink } = props.route.params!;
      nav.navigate("CreatePickName", { inviteLink });
    } else if (currentRoute === "ExistingSetupKey") {
      nav.navigate("UseExisting");
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
        {loading && <ActivityIndicator size="large" />}
        {!loading && (
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

const styles = StyleSheet.create({
  paddedPage: {
    paddingTop: 36,
    paddingHorizontal: 24,
  },
});
