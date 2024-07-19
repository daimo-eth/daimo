import { StyleSheet, View } from "react-native";

import { OnboardingHeader } from "./OnboardingHeader";
import { TranslationFunctions } from "../../../i18n/i18n-types";
import {
  getAccountManager,
  useAccountAndKeyInfo,
} from "../../../logic/accountManager";
import { EnclaveKeyInfo } from "../../../logic/enclave";
import { useI18n } from "../../../logic/i18n";
import { Account } from "../../../storage/account";
import { ButtonBig } from "../../shared/Button";
import Spacer from "../../shared/Spacer";
import { ss } from "../../shared/style";
import { TextH3, TextPara } from "../../shared/text";
import { AccountHeader } from "../SettingsScreen";

export function MissingKeyScreen() {
  const i18n = useI18n();
  const { account, keyInfo } = useAccountAndKeyInfo();

  const logout = () => getAccountManager().deleteAccountAndKey();

  if (account == null) return null;
  if (keyInfo == null) return null;

  const [title, desc] = getKeyErrorDesc(account, keyInfo, i18n);

  console.log(
    `[ONBOARDING] MISSING KEY ${account.name}, ${account.accountKeys.length} keys, ${account.pendingKeyRotation.length} pending rotations, pubKeyHex: ${keyInfo.pubKeyHex} title: ${title}, desc: ${desc}`
  );

  return (
    <View>
      <OnboardingHeader title={i18n.missingKey.screenHeader()} />
      <View style={styles.paddedPage}>
        <AccountHeader account={account} noLinkedAccounts />
        <Spacer h={32} />
        <View style={ss.container.padH8}>
          <TextH3>{title}</TextH3>
          <Spacer h={8} />
          <TextPara>{desc}</TextPara>
        </View>
        <Spacer h={32} />
        <ButtonBig
          type="primary"
          title={i18n.missingKey.logOut()}
          onPress={logout}
        />
      </View>
    </View>
  );
}

function getKeyErrorDesc(
  account: Account,
  keyInfo: EnclaveKeyInfo,
  i18n: TranslationFunctions
) {
  console.log(
    `[ONBOARDING] getKeyErrorDesc ${account.name} ${JSON.stringify(keyInfo)}`
  );
  if (keyInfo.pubKeyHex == null) {
    return [
      i18n.missingKey.keyErrorDesc.noKey.title(),
      i18n.missingKey.keyErrorDesc.noKey.desc(),
    ];
  }
  if (account.accountKeys.find((k) => k.pubKey === keyInfo.pubKeyHex) == null) {
    return [
      i18n.missingKey.keyErrorDesc.removedKey.title(),
      i18n.missingKey.keyErrorDesc.removedKey.desc(),
    ];
  }
  return [i18n.missingKey.keyErrorDesc.unhandledKeyError.title(), ""];
}

const styles = StyleSheet.create({
  paddedPage: {
    paddingTop: 36,
    paddingHorizontal: 24,
  },
});
