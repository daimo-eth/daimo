import {
  DaimoLink,
  LinkInviteStatus,
  parseInviteCodeOrLink,
} from "@daimo/common";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { PureComponent } from "react";
import { Linking, Platform, View } from "react-native";

import { OnboardingHeader, getNumOnboardingSteps } from "./OnboardingHeader";
import VidInviteAnimation from "../../../../assets/onboarding/invite-animation.mp4";
import {
  ParamListOnboarding,
  useExitBack,
  useOnboardingNav,
} from "../../../common/nav";
import { TranslationFunctions } from "../../../i18n/i18n-types";
import { getAccountManager } from "../../../logic/accountManager";
import { useI18n } from "../../../logic/i18n";
import { fetchInviteLinkStatus } from "../../../logic/linkStatus";
import { ButtonBig, TextButton } from "../../shared/Button";
import { CoverVideo } from "../../shared/CoverGraphic";
import { InputBig } from "../../shared/InputBig";
import Spacer from "../../shared/Spacer";
import { color, ss } from "../../shared/style";
import { TextBodyMedium, TextCenter } from "../../shared/text";

export function OnboardingEnterInviteScreen() {
  // No invite code? Join waitlist
  const linkToWaitlist = () => {
    const url = `https://daimo.com/waitlist`;
    Linking.openURL(url);
  };
  const i18n = useI18n();

  const nav = useOnboardingNav();

  return (
    <View style={ss.container.flexGrow}>
      <OnboardingHeader
        title={i18n.onboardingEnterInvite.screenHeader()}
        onPrev={useExitBack()}
        steps={getNumOnboardingSteps()}
        activeStep={0}
      />
      <View style={ss.container.topBottom}>
        <View key="top" style={ss.container.padH24}>
          <Spacer h={24} />
          <CoverVideo video={VidInviteAnimation} />
          <Spacer h={12} />
          <Instructions _i18n={i18n} />
          <Spacer h={24} />
          <EnterCodeForm nav={nav} />
        </View>
        <View key="bottom">
          <Spacer h={16} />
          <TextButton
            title={i18n.onboardingEnterInvite.waitlistButton()}
            onPress={linkToWaitlist}
          />
          <Spacer h={16} />
        </View>
      </View>
    </View>
  );
}

function Instructions({ _i18n }: { _i18n: TranslationFunctions }) {
  return (
    <TextCenter>
      <TextBodyMedium color={color.grayMid}>
        {_i18n.onboardingEnterInvite.instructions()}
      </TextBodyMedium>
    </TextCenter>
  );
}

interface EnterCodeProps {
  nav: NativeStackNavigationProp<ParamListOnboarding>;
}

interface EnterCodeState {
  text: string;
  inviteLink?: DaimoLink;
  inviteStatus?: LinkInviteStatus;
}

class EnterCodeForm extends PureComponent<EnterCodeProps, EnterCodeState> {
  constructor(props: EnterCodeProps) {
    super(props);
    this.state = { text: "" };
  }

  editText = async (text: string) => {
    // Update textbox immediately
    const inviteLink = parseInviteCodeOrLink(text);
    this.setState({ text, inviteLink, inviteStatus: undefined });

    // Special case for testnet
    if (text === "testnet") {
      this.setState({ inviteStatus: { isValid: true } });
      return;
    }

    // Fetch link status
    const dc = getAccountManager().getDaimoChain();
    const inviteStatus = await fetchInviteLinkStatus(dc, inviteLink);

    // See if text has changed in the meantime
    if (this.state.text !== text) return;

    // Otherwise, update state
    this.setState({ inviteLink, inviteStatus });
  };

  goToNextStep = () => {
    const { text, inviteLink } = this.state;
    if (inviteLink == null) return;

    // Hack: the "testnet" invite code is a cheat code to connect to testnet API
    let daimoChain = getAccountManager().getDaimoChain();
    if (text === "testnet") daimoChain = "baseSepolia";
    console.log(`[ONBOARDING] proceeding, invite ${text}, chain ${daimoChain}`);
    getAccountManager().setDaimoChain(daimoChain);

    // Move to next screen
    const { nav } = this.props;
    const isAndroid = Platform.OS === "android";
    if (isAndroid) nav.navigate("CreateSetupKey", { inviteLink });
    else nav.navigate("CreateChooseName", { inviteLink });
  };

  render = () => {
    const i18n = useI18n();
    // User enters their invite code. Check validity.
    const { text, inviteStatus } = this.state;

    return (
      <View>
        <InputBig
          placeholder={i18n.onboardingEnterInvite.inviteCode.title()}
          value={text}
          onChange={this.editText}
          center={text.length < 16} // Workaround for Android centering bug
        />
        <Spacer h={24} />
        <ButtonBig
          type="primary"
          title={i18n.shared.buttonAction.submit()}
          onPress={this.goToNextStep}
          disabled={inviteStatus == null || !inviteStatus.isValid}
        />
      </View>
    );
  };
}
