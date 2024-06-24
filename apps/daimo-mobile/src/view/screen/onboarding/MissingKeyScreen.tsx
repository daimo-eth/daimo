import { StyleSheet, View } from "react-native";

import { OnboardingHeader } from "./OnboardingHeader";
import {
  getAccountManager,
  useAccountAndKeyInfo,
} from "../../../logic/accountManager";
import { EnclaveKeyInfo } from "../../../logic/enclave";
import { Account } from "../../../storage/account";
import { ButtonBig } from "../../shared/Button";
import Spacer from "../../shared/Spacer";
import { ss } from "../../shared/style";
import { TextH3, TextPara } from "../../shared/text";
import { AccountHeader } from "../SettingsScreen";

export function MissingKeyScreen() {
  const { account, keyInfo } = useAccountAndKeyInfo();

  const logout = () => getAccountManager().deleteAccountAndKey();

  if (account == null) return null;
  if (keyInfo == null) return null;

  const [title, desc] = getKeyErrorDesc(account, keyInfo);

  console.log(
    `[ONBOARDING] MISSING KEY ${account.name}, ${account.accountKeys.length} keys, ${account.pendingKeyRotation.length} pending rotations, pubKeyHex: ${keyInfo.pubKeyHex} title: ${title}, desc: ${desc}`
  );

  return (
    <View>
      <OnboardingHeader title="Missing Key" />
      <View style={styles.paddedPage}>
        <AccountHeader account={account} noLinkedAccounts />
        <Spacer h={32} />
        <View style={ss.container.padH8}>
          <TextH3>{title}</TextH3>
          <Spacer h={8} />
          <TextPara>{desc}</TextPara>
        </View>
        <Spacer h={32} />
        <ButtonBig type="primary" title="LOG OUT" onPress={logout} />
      </View>
    </View>
  );
}

function getKeyErrorDesc(account: Account, keyInfo: EnclaveKeyInfo) {
  console.log(
    `[ONBOARDING] getKeyErrorDesc ${account.name} ${JSON.stringify(keyInfo)}`
  );
  if (keyInfo.pubKeyHex == null) {
    return [
      "New phone?",
      "We found your account, but no device key. Keys in secure hardware " +
        "never leave your device, so they don't transfer when you get a new " +
        "phone. Log out, then log in using a backup key.",
    ];
  }
  if (account.accountKeys.find((k) => k.pubKey === keyInfo.pubKeyHex) == null) {
    return [
      "Device removed",
      "It looks like the key on this device was removed from your account. " +
        "Log out, then log in using a backup key.",
    ];
  }
  return ["Unhandled key error", ""];
}

const styles = StyleSheet.create({
  paddedPage: {
    paddingTop: 36,
    paddingHorizontal: 24,
  },
});
