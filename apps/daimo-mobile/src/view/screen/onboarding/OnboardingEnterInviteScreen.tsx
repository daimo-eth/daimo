import { getEAccountStr } from "@daimo/common";
import { getChainConfig } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import { useCallback, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";

import { OnboardingHeader } from "./OnboardingHeader";
import { useExitBack, useOnboardingNav } from "../../../common/nav";
import { getAccountManager } from "../../../logic/accountManager";
import {
  useOnboardingInviteCode,
  useOnboardingPasteInvite,
} from "../../../logic/onboarding";
import { ButtonBig, TextButton } from "../../shared/Button";
import { InputBig, OctName } from "../../shared/InputBig";
import { IntroTextParagraph } from "../../shared/IntroTextParagraph";
import Spacer from "../../shared/Spacer";
import { color } from "../../shared/style";
import { TextCenter, TextError, TextLight } from "../../shared/text";

export function OnboardingEnterInviteScreen() {
  // 1. Paste invite from link
  const { pasteInviteLink, pasteLinkError } = useOnboardingPasteInvite();

  // 2. Enter invite code manually
  const [mode, setMode] = useState("paste" as "paste" | "enter");
  const enterManually = () => setMode("enter");

  // 3. No invite code? Join waitlist
  const linkToWaitlist = () => {
    const url = `https://daimo.com/waitlist`;
    Linking.openURL(url);
  };

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
        {mode === "paste" && (
          <>
            <TextCenter>
              <TextError>{pasteLinkError || <>&nbsp;</>}</TextError>
            </TextCenter>
            <Spacer h={8} />
            <ButtonBig
              type="primary"
              title="PASTE INVITE FROM LINK"
              onPress={pasteInviteLink}
            />
            <Spacer h={16} />
            <TextButton title="Enter code manually" onPress={enterManually} />
          </>
        )}
        {mode === "enter" && (
          <>
            <EnterCodeForm />
            <Spacer h={16} />
            <TextButton title="JOIN WAITLIST" onPress={linkToWaitlist} />
          </>
        )}
      </View>
    </View>
  );
}

function EnterCodeForm() {
  // User enters their invite code. Check validity.
  const [text, setText] = useState("");
  const { inviteLink, inviteStatus, daimoChain } =
    useOnboardingInviteCode(text);

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

  // Once done, create account.
  const nav = useOnboardingNav();
  const goToNextStep = useCallback(() => {
    if (inviteLink == null) return;
    console.log(`[ONBOARDING] proceeding, invite ${text}, chain ${daimoChain}`);
    getAccountManager().setDaimoChain(daimoChain);
    nav.navigate("CreatePickName", { inviteLink });
  }, [nav, inviteLink, daimoChain]);

  return (
    <View>
      <InputBig
        placeholder="enter invite code"
        value={text}
        onChange={setText}
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
        onPress={goToNextStep}
        disabled={inviteStatus == null || !inviteStatus.isValid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  paddedPage: {
    paddingTop: 36,
    paddingHorizontal: 24,
  },
});
