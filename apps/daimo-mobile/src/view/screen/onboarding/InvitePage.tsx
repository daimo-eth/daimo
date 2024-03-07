import {
  DaimoLink,
  EAccount,
  formatDaimoLink,
  getEAccountStr,
  getInvitePasteLink,
  getInviteStatus,
} from "@daimo/common";
import { DaimoChain } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { Linking, View, StyleSheet } from "react-native";

import { OnboardingHeader } from "./OnboardingHeader";
import { useFetchLinkStatus } from "../../../logic/linkStatus";
import { ButtonBig, TextButton } from "../../shared/Button";
import { InputBig, OctName } from "../../shared/InputBig";
import { IntroTextParagraph } from "../../shared/IntroTextParagraph";
import Spacer from "../../shared/Spacer";
import { color } from "../../shared/style";
import { TextCenter, TextLight } from "../../shared/text";

export function InvitePage({
  onNext,
  onPrev,
  daimoChain,
  inviteLink,
  setInviteLink,
}: {
  onNext: ({ isTestnet }: { isTestnet: boolean }) => void;
  onPrev?: () => void;
  daimoChain: DaimoChain;
  inviteLink: DaimoLink | undefined;
  setInviteLink: (inviteLink: DaimoLink | undefined) => void;
}) {
  // We haven't picked a daimoChain yet so calls default to prod.
  // Handle invite links from deep link opens.
  const [text, setText] = useState(
    inviteLink ? formatDaimoLink(inviteLink) : ""
  );
  const [isValid, setIsValid] = useState(!!inviteLink);
  const [sender, setSender] = useState<EAccount | undefined>(undefined);

  // HACK: Workaround for testnet to never query API
  const isTestnet = text === "testnet";
  useEffect(() => {
    if (isTestnet) setIsValid(true);
  }, [isTestnet]);

  const onChange = (newText: string) => {
    setInviteLink(getInvitePasteLink(newText));
    setText(newText);
  };

  // Strip seed from note links if they have one.
  const strippedInviteLink =
    inviteLink?.type === "notev2"
      ? {
          seed: undefined,
          ...inviteLink,
        }
      : inviteLink;
  const linkStatus = useFetchLinkStatus(strippedInviteLink, daimoChain);

  useEffect(() => {
    if (!linkStatus || linkStatus.data == null) return;

    const inviteStatus = getInviteStatus(linkStatus.data);
    setIsValid(inviteStatus.isValid);
    setSender(inviteStatus.sender);
  }, [linkStatus]);

  const oct = (name: OctName, color?: string) => (
    <Octicons {...{ name, color }} size={14} />
  );

  // Show invite status (valid/invalid) once user starts typing
  const hasNotStartedTyping = text === "" && !isValid;
  const status = (function () {
    if (!linkStatus || hasNotStartedTyping) {
      return " ";
    } else if (linkStatus.data == null) {
      return "...";
    } else if (isValid) {
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

  const linkToWaitlist = () => {
    const url = `https://daimo.com/waitlist`;
    Linking.openURL(url);
  };

  const fetchClipboard = async () => {
    const pasteText = await Clipboard.getStringAsync();
    if (pasteText) onChange(pasteText);
  };

  useEffect(() => {
    if (!inviteLink) return;

    if (inviteLink.type === "invite") {
      setText(inviteLink.code);
    } else {
      // shorten displayed link from cleaned up url
      setText(formatDaimoLink(inviteLink));
    }
  }, [inviteLink]);

  return (
    <View>
      <OnboardingHeader title="Invite" onPrev={onPrev} />
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
        <InputBig
          placeholder="enter invite code"
          value={text}
          onChange={onChange}
          center={text.length < 16} // Workaround for Android centering bug
        />
        <Spacer h={16} />
        {hasNotStartedTyping ? (
          <>
            <TextCenter>
              <TextLight>or</TextLight>
            </TextCenter>
            <Spacer h={16} />
            <ButtonBig
              type="primary"
              title="Paste invite from link"
              onPress={fetchClipboard}
            />
            <Spacer h={16} />
            <TextButton title="Join waitlist" onPress={linkToWaitlist} />
          </>
        ) : (
          <>
            <TextCenter>
              <TextLight>{status}</TextLight>
            </TextCenter>
            <Spacer h={16} />
            <ButtonBig
              type="primary"
              title="Submit"
              onPress={() => onNext({ isTestnet })}
              disabled={!isValid}
            />
          </>
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
