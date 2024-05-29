import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { OnboardingHeader } from "./OnboardingHeader";
import { useOnboardingNav } from "../../../common/nav";
import { useAccountAndKeyInfo } from "../../../logic/accountManager";
import { validateSessionKeyWithSignature } from "../../../logic/sessionKey";
import { ButtonBig } from "../../shared/Button";
import Spacer from "../../shared/Spacer";
import { ss } from "../../shared/style";
import { TextH3, TextPara } from "../../shared/text";
import { AccountHeader } from "../SettingsScreen";

export function ExistingReinstallScreen() {
  const { account, keyInfo } = useAccountAndKeyInfo();
  const nav = useOnboardingNav();
  const [isLoading, setIsLoading] = useState(false);

  if (account == null) return null;
  if (keyInfo == null) return null;

  console.log(
    `[ONBOARDING] REINSTALLED APP ${account.name}, ${account.accountKeys.length} keys, ${account.pendingKeyRotation.length} pending rotations, pubKeyHex: ${keyInfo.pubKeyHex}`
  );

  const login = async () => {
    setIsLoading(true);
    await validateSessionKeyWithSignature(account);
    nav.navigate("AllowNotifs", { showProgressBar: false });
  };

  return (
    <View>
      <OnboardingHeader title="Reinstalled App" />
      <View style={styles.paddedPage}>
        <AccountHeader account={account} noLinkedAccounts />
        <Spacer h={32} />
        <View style={ss.container.padH8}>
          <TextH3>Login to {account.name}</TextH3>
          <Spacer h={8} />
          <TextPara>
            It looks like you've reinstalled the app. You can log in to your
            account using the existing device key.
          </TextPara>
        </View>
        <Spacer h={32} />
        {isLoading ? (
          <ActivityIndicator size="large" />
        ) : (
          <ButtonBig
            type="primary"
            title="LOG IN"
            onPress={login}
            showBiometricIcon
          />
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
