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
import { OctName } from "../shared/InputBig";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { color } from "../shared/style";
import { TextBody, TextCenter, TextH3 } from "../shared/text";

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

function CreateBackupContent({ setStep }: { setStep: (value: 0 | 1) => void }) {
  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={{ paddingHorizontal: 24 }}
    >
      <TextCenter>
        <TextH3>Create a backup</TextH3>
      </TextCenter>
      <Spacer h={16} />
      <View style={styles.separator} />
      <Spacer h={16} />
      <BackupOptionRow icon="key" title="Set up a passkey backup" />
      <Spacer h={16} />
      <BulletRow text="Convenient, secure, and resistant to phishing" />
      <BulletRow text="Stored by your password manager, like iCloud Keychain or 1Password" />
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

function BulletRow({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: "row" }}>
      <TextBody>•</TextBody>
      <Spacer w={8} />
      <TextBody color={color.grayMid}>{text}</TextBody>
    </View>
  );
}

function OfflineBackupContent({
  setStep,
}: {
  setStep: (value: 0 | 1) => void;
}) {
  const nav = useNav();
  const dispatcher = useContext(DispatcherContext);

  const goToSeedPhrase = useCallback(() => {
    dispatcher.dispatch({ name: "hideBottomSheet" });
    nav.navigate("SettingsTab", { screen: "SeedPhrase" });
  }, [nav, dispatcher]);

  const goToSecurityKey = useCallback(() => {
    dispatcher.dispatch({ name: "hideBottomSheet" });
    nav.navigate("SettingsTab", { screen: "AddPasskey" });
  }, [nav, dispatcher]);

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={{ paddingHorizontal: 24 }}
    >
      <ScreenHeader
        title="Create an offline backup"
        onBack={() => setStep(0)}
        hideOfflineHeader
      />
      <View style={styles.separator} />
      <Spacer h={20} />
      {Platform.OS !== "android" && (
        <>
          <BackupOptionRow icon="key" title="Set up a security key backup" />
          <Spacer h={16} />
          <BulletRow text="Use a physical FIDO key, such as a YubiKey" />
          <Spacer h={24} />
          <ButtonBig
            type="primary"
            title="Back up with security key"
            onPress={goToSecurityKey}
          />
          <Spacer h={20} />
          <View style={styles.separator} />
          <Spacer h={20} />
        </>
      )}
      <BackupOptionRow icon="comment" title="Set up a seed phrase" />
      <Spacer h={16} />
      <BulletRow text="Your funds are connected to a phrase you can store securely" />
      <Spacer h={24} />
      <ButtonBig
        type="subtle"
        title="Backup with seed phrase"
        onPress={goToSeedPhrase}
      />
    </Animated.View>
  );
}

function BackupOptionRow({
  icon,
  title,
  recommended,
}: {
  icon: OctName;
  title: string;
  recommended?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View style={styles.keyCircle}>
        <Octicons name={icon} size={20} color={color.primary} />
      </View>
      <Spacer w={12} />
      <TextBody>{title}</TextBody>
      {recommended && <View style={{}} />}
    </View>
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
