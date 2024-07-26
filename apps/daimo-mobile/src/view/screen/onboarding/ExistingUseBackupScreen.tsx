import { EAccount, assertNotNull, getAccountName } from "@daimo/common";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { Hex } from "viem";

import { LogInFromKeyButton } from "./LogInButton";
import { OnboardingHeader } from "./OnboardingHeader";
import {
  ParamListOnboarding,
  useExitBack,
  useOnboardingNav,
} from "../../../common/nav";
import {
  useAccountAndKeyInfo,
  useDaimoChain,
} from "../../../logic/accountManager";
import {
  Account,
  createEmptyAccount,
  defaultEnclaveKeyName,
} from "../../../storage/account";
import { hydrateAccount } from "../../../sync/sync";
import { ContactBubble } from "../../shared/Bubble";
import { ButtonBig } from "../../shared/Button";
import Spacer from "../../shared/Spacer";
import { ErrorRowCentered } from "../../shared/error";
import { color, ss } from "../../shared/style";
import { TextBodyMedium, TextCenter, TextH2 } from "../../shared/text";

type Props = NativeStackScreenProps<ParamListOnboarding, "ExistingUseBackup">;
export function ExistingUseBackupScreen({ route }: Props) {
  const { targetEAcc } = route.params;

  return (
    <View style={ss.container.flexGrow}>
      <OnboardingHeader
        title="Choose a recovery option"
        onPrev={useExitBack()}
      />
      <Spacer h={16} />
      <LogInOptions eAcc={targetEAcc} />
    </View>
  );
}

function LogInOptions({ eAcc }: { eAcc: EAccount }) {
  // Passkey, security key: just log in
  const { keyInfo } = useAccountAndKeyInfo();
  const pubKeyHex = assertNotNull(keyInfo?.pubKeyHex, "Missing pubKeyHex");
  const daimoChain = useDaimoChain();

  // TODO: do not load the entire account history here
  // Only the minimum (accountKeys + chainGasConstants, maybe) required
  const [account, setAccount] = useState<Account>();
  const [loadAccountErr, setLoadAccountErr] = useState<Error>();
  useEffect(() => {
    loadAccount(eAcc, pubKeyHex)
      .then(setAccount)
      .catch((e: any) => {
        console.error(`[ONBOARDING] loadAccount error: ${e}`);
        setLoadAccountErr(e);
      });
  }, [eAcc]);

  // Seed phrase requires additional entry
  const nav = useOnboardingNav();
  const chooseSeed = () => {
    const targetAccount = assertNotNull(account);
    nav.navigate("ExistingSeedPhrase", { targetAccount });
  };

  // TODO: show only options available for this account.

  return (
    <View style={ss.container.topBottom}>
      <View key="top" style={ss.container.padH24}>
        <Spacer h={32} />
        <View style={{ flexDirection: "column", alignItems: "center" }}>
          <ContactBubble contact={{ type: "eAcc", ...eAcc }} size={64} />
          <Spacer h={16} />
          <TextH2>{getAccountName(eAcc)}</TextH2>
        </View>
        <Spacer h={32} />
        <TextCenter>
          <TextBodyMedium color={color.grayMid}>
            Log in with a backup key.{"\n"}
            This adds your device to the account.
          </TextBodyMedium>
        </TextCenter>
      </View>
      <View key="bottom" style={ss.container.padH24}>
        {account == null && loadAccountErr == null && (
          <ActivityIndicator size="large" />
        )}
        {account == null && loadAccountErr != null && (
          <ErrorRowCentered error={loadAccountErr} />
        )}
        {account != null && (
          <>
            <Spacer h={32} />
            <LogInFromKeyButton
              account={account}
              pubKeyHex={pubKeyHex}
              daimoChain={daimoChain}
              useSecurityKey={false}
            />
            <Spacer h={16} />
            {Platform.OS !== "android" && (
              <>
                <LogInFromKeyButton
                  account={account}
                  pubKeyHex={pubKeyHex}
                  daimoChain={daimoChain}
                  useSecurityKey
                />
                <Spacer h={16} />
              </>
            )}
            <ButtonBig
              type="subtle"
              title="LOG IN WITH SEED PHRASE"
              onPress={chooseSeed}
            />
          </>
        )}
        <Spacer h={32} />
      </View>
    </View>
  );
}

async function loadAccount(eAcc: EAccount, pubKeyHex: Hex) {
  const newAccount = createEmptyAccount({
    enclaveKeyName: defaultEnclaveKeyName,
    enclavePubKey: pubKeyHex,
    address: eAcc.addr,
    name: assertNotNull(eAcc.name),
    accountVersion: assertNotNull(eAcc.accountVersion),
    homeChainId: assertNotNull(eAcc.homeChain),
    homeCoinAddress: assertNotNull(eAcc.homeCoin),
  });

  return await hydrateAccount(newAccount);
}
