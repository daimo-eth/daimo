import Octicons from "@expo/vector-icons/Octicons";
import { useCallback, useContext, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";

import { DispatcherContext } from "../../action/dispatch";
import { useNav } from "../../common/nav";
import { ButtonBig } from "../shared/Button";
import Spacer from "../shared/Spacer";
import { color } from "../shared/style";
import { TextBody, TextH3 } from "../shared/text";

export function CreateBackupSheet() {
  const [step, setStep] = useState<0 | 1>(0);

  return (
    <Animated.View layout={LinearTransition}>
      {step === 0 ? (
        <CreateBackupContent setStep={setStep} />
      ) : (
        <OfflineBackupContent setStep={setStep} />
      )}
    </Animated.View>
  );
}

function CreateBackupContent({ setStep }: { setStep: any }) {
  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={{ paddingHorizontal: 24 }}
    >
      <TextH3>Create a backup</TextH3>
      <Spacer h={16} />
      <View style={styles.separator} />
      <Spacer h={16} />
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={styles.keyCircle}>
          <Octicons name="key" size={20} color={color.primary} />
        </View>
        <Spacer w={12} />
        <TextBody>Set up a passkey backup</TextBody>
        <View style={{}} />
      </View>
      <Spacer h={16} />
      <View>
        <View style={{ flexDirection: "row" }}>
          <TextBody>-</TextBody>
          <Spacer w={8} />
          <TextBody color={color.grayMid} style={{ lineHeight: 1.5 }}>
            Convenient, secure, and resistant to phishing
          </TextBody>
        </View>
        <View style={{ flexDirection: "row" }}>
          <TextBody>-</TextBody>
          <Spacer w={8} />
          <TextBody color={color.grayMid} style={{ lineHeight: 3 }}>
            Stored by your password manager, like iCloud Keychain or 1Password
          </TextBody>
        </View>
      </View>
      <Spacer h={24} />
      <ButtonBig type="primary" title="Backup with passkey" />
      <Spacer h={24} />
      <ButtonBig
        type="subtle"
        title="Backup offline backup instead"
        onPress={() => setStep(1)}
      />
    </Animated.View>
  );
}

function OfflineBackupContent({ setStep }: { setStep: any }) {
  const nav = useNav();
  const dispatcher = useContext(DispatcherContext);

  const goToSeedPhrase = useCallback(() => {
    dispatcher.dispatch({ name: "hideBottomSheet" });
    nav.navigate("SettingsTab", { screen: "SeedPhrase" });
  }, [nav, dispatcher]);

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={{ paddingHorizontal: 24 }}
    >
      <TextH3>Create an offline backup</TextH3>
      <Spacer h={16} />
      <View style={styles.separator} />
      {Platform.OS !== "android" && <View />}
      <TextBody color={color.grayDark}>
        Your funds are connected to a phrase you can store securely.
      </TextBody>
      <Spacer h={24} />
      <ButtonBig
        type="subtle"
        title="Backup with seed phrase"
        onPress={goToSeedPhrase}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  keyCircle: {
    backgroundColor: color.grayLight,
    height: 40,
    width: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  separator: {
    borderBottomWidth: 0.5,
    borderBottomColor: color.grayLight,
  },
});
