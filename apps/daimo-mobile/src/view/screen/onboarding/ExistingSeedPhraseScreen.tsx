import { assertNotNull } from "@daimo/common";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { View } from "react-native";

import { LogInFromSeedButton } from "./LogInButton";
import { OnboardingHeader } from "./OnboardingHeader";
import { ParamListOnboarding, useExitBack } from "../../../common/nav";
import {
  useAccountAndKeyInfo,
  useDaimoChain,
} from "../../../logic/accountManager";
import { useI18n } from "../../../logic/i18n";
import {
  SeedPhraseEntry,
  useSeedPhraseInput,
} from "../../shared/SeedPhraseDisplay";
import Spacer from "../../shared/Spacer";
import { ss } from "../../shared/style";

type Props = NativeStackScreenProps<ParamListOnboarding, "ExistingSeedPhrase">;
export function ExistingSeedPhraseScreen({ route }: Props) {
  const i18n = useI18n();

  // The account we're logging in to
  const { targetAccount } = route.params;

  const [state, dispatch] = useSeedPhraseInput();

  const mnemonic = state.map((v) => v.trim()).join(" ");

  // Passkey, security key: just log in
  const { keyInfo } = useAccountAndKeyInfo();
  const pubKeyHex = assertNotNull(keyInfo?.pubKeyHex, "Missing pubKeyHex");
  const daimoChain = useDaimoChain();

  return (
    <View>
      <OnboardingHeader
        title={i18n.existingSeedPhrase.screenHeader()}
        onPrev={useExitBack()}
      />
      <View style={ss.container.padH24}>
        <Spacer h={16} />
        <SeedPhraseEntry {...{ state, dispatch }} />
        <Spacer h={24} />
        <LogInFromSeedButton
          account={targetAccount}
          {...{ daimoChain, pubKeyHex, mnemonic }}
          _i18n={i18n}
        />
      </View>
    </View>
  );
}
