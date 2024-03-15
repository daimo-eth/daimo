import {
  DaimoLink,
  LinkInviteStatus,
  getEAccountStr,
  parseInviteCodeOrLink,
} from "@daimo/common";
import { getChainConfig } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { PureComponent } from "react";
import { Linking, Platform, StyleSheet, View } from "react-native";

import { OnboardingHeader } from "./OnboardingHeader";
import {
  ParamListOnboarding,
  useExitBack,
  useOnboardingNav,
} from "../../../common/nav";
import { getAccountManager } from "../../../logic/accountManager";
import { fetchInviteLinkStatus } from "../../../logic/linkStatus";
import { ButtonBig, TextButton } from "../../shared/Button";
import { InputBig, OctName } from "../../shared/InputBig";
import { IntroTextParagraph } from "../../shared/IntroTextParagraph";
import Spacer from "../../shared/Spacer";
import { color } from "../../shared/style";
import { TextCenter, TextLight } from "../../shared/text";

export function OnboardingEnterInviteScreen() {
  // No invite code? Join waitlist
  const linkToWaitlist = () => {
    const url = `https://daimo.com/waitlist`;
    Linking.openURL(url);
  };

  const nav = useOnboardingNav();

  return (
    <View>
      <OnboardingHeader title="Invite" onPrev={useExitBack()} />
      <View style={styles.paddedPage}>
        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <Octicons name="mail" size={40} color={color.midnight} />
        </View>
        <Spacer h={24} />
        <TextCenter>
          <IntroTextParagraph>
            Daimo is currently invite-only. Type your invite code below or paste
            it from a link.{"\n"}Don't have one? Join the waitlist.
          </IntroTextParagraph>
        </TextCenter>
        <Spacer h={32} />
        <EnterCodeForm nav={nav} />
        <Spacer h={16} />
        <TextButton title="JOIN WAITLIST" onPress={linkToWaitlist} />
      </View>
    </View>
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
    else nav.navigate("CreatePickName", { inviteLink });
  };

  render() {
    // User enters their invite code. Check validity.
    const { text, inviteLink, inviteStatus } = this.state;
    const daimoChain = getAccountManager().getDaimoChain();

    // Show invite status (valid/invalid) once user starts typing
    const oct = (name: OctName, color?: string) => (
      <Octicons {...{ name, color }} size={14} />
    );
    const isTestnet = !!getChainConfig(daimoChain).chainL2.testnet;
    const status = (function () {
      if (inviteLink == null) {
        return " ";
      } else if (inviteStatus == null) {
        return "...";
      } else if (inviteStatus.isValid) {
        const { sender } = inviteStatus;
        return (
          <>
            {oct("check-circle", color.successDark)} valid
            {isTestnet ? " testnet " : " "}invite
            {sender && ` from ${getEAccountStr(sender)}`}
          </>
        );
      } else {
        return <>{oct("alert")} invalid invite</>;
      }
    })();

    return (
      <View>
        <InputBig
          placeholder="enter invite code"
          value={text}
          onChange={this.editText}
          center={text.length < 16} // Workaround for Android centering bug
        />
        <Spacer h={16} />
        <TextCenter>
          <TextLight>{status}</TextLight>
        </TextCenter>
        <Spacer h={16} />
        <ButtonBig
          type="primary"
          title="Submit"
          onPress={this.goToNextStep}
          disabled={inviteStatus == null || !inviteStatus.isValid}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  paddedPage: {
    paddingTop: 36,
    paddingHorizontal: 24,
  },
});
