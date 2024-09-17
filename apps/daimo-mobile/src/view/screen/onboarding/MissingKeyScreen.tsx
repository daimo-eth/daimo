import { StyleSheet, View } from "react-native";

import { OnboardingHeader } from "./OnboardingHeader";
import { i18n } from "../../../i18n";
import {
  getAccountManager,
  useAccountAndKeyInfo,
} from "../../../logic/accountManager";
import { EnclaveKeyInfo } from "../../../logic/enclave";
import { Account } from "../../../storage/account";
import { ButtonBig } from "../../shared/Button";
import Spacer from "../../shared/Spacer";
import { TextH3, TextPara } from "../../shared/text";
import { useTheme } from "../../style/theme";
import { AccountHeader } from "../SettingsScreen";

const i18 = i18n.missingKey;

export function MissingKeyScreen() {
  const { ss } = useTheme();
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
      <OnboardingHeader title={i18.screenHeader()} />
      <View style={styles.paddedPage}>
        <AccountHeader account={account} noLinkedAccounts />
        <Spacer h={32} />
        <View style={ss.container.padH8}>
          <TextH3>{title}</TextH3>
          <Spacer h={8} />
          <TextPara>{desc}</TextPara>
        </View>
        <Spacer h={32} />
        <ButtonBig type="primary" title={i18.logOut()} onPress={logout} />
      </View>
    </View>
  );
}

function getKeyErrorDesc(account: Account, keyInfo: EnclaveKeyInfo) {
  console.log(
    `[ONBOARDING] getKeyErrorDesc ${account.name} ${JSON.stringify(keyInfo)}`
  );
  if (keyInfo.pubKeyHex == null) {
    return [i18.keyErrorDesc.noKey.title(), i18.keyErrorDesc.noKey.desc()];
  }
  if (account.accountKeys.find((k) => k.pubKey === keyInfo.pubKeyHex) == null) {
    return [
      i18.keyErrorDesc.removedKey.title(),
      i18.keyErrorDesc.removedKey.desc(),
    ];
  }
  return [i18.keyErrorDesc.unhandledKeyError.title(), ""];
}

const styles = StyleSheet.create({
  paddedPage: {
    paddingTop: 36,
    paddingHorizontal: 24,
  },
});
