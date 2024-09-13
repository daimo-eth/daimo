import { assertNotNull } from "@daimo/common";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { View } from "react-native";

import { LogInFromSeedButton } from "./LogInButton";
import { OnboardingHeader } from "./OnboardingHeader";
import { ParamListOnboarding, useExitBack } from "../../../common/nav";
import { i18n } from "../../../i18n";
import {
  useAccountAndKeyInfo,
  useDaimoChain,
} from "../../../logic/accountManager";
import {
  SeedPhraseEntry,
  useSeedPhraseInput,
} from "../../shared/SeedPhraseDisplay";
import Spacer from "../../shared/Spacer";
import { useTheme } from "../../style/theme";

const i18 = i18n.existingSeedPhrase;

type Props = NativeStackScreenProps<ParamListOnboarding, "ExistingSeedPhrase">;
export function ExistingSeedPhraseScreen({ route }: Props) {
  const { ss } = useTheme();

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
      <OnboardingHeader title={i18.screenHeader()} onPrev={useExitBack()} />
      <View style={ss.container.padH24}>
        <Spacer h={16} />
        <SeedPhraseEntry {...{ state, dispatch }} />
        <Spacer h={24} />
        <LogInFromSeedButton
          account={targetAccount}
          {...{ daimoChain, pubKeyHex, mnemonic }}
        />
      </View>
    </View>
  );
}
