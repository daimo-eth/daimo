import {
  DaimoLink,
  EAccount,
  formatDaimoLink,
  getEAccountStr,
  getInvitePasteLink,
  getInviteStatus,
  stripSeedFromNoteLink,
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
  const linkToWaitlist = () => {
    const url = `https://daimo.com/waitlist`;
    Linking.openURL(url);
  };

  const [pasteLinkError, setPasteLinkError] = useState("");
  const pasteInviteLink = async () => {
    const str = await Clipboard.getStringAsync();
    console.log(`[INVITE] paste invite link: '${str}'`);
    try {
      setInviteLink(getInvitePasteLink(str));
      onNext({ isTestnet: false });
    } catch (e: any) {
      console.warn(`[INTRO] can't parse invite link: '${str}'`, e.getMessage());
      setPasteLinkError("Copy link & try again.");
    }
  };

  // Enter manually
  const [mode, setMode] = useState("paste" as "paste" | "enter");
  const enterManually = () => setMode("enter");

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
        {mode === "paste" && (
          <>
            <ButtonBig
              type="primary"
              title="Paste invite from link"
              onPress={pasteInviteLink}
            />
            <Spacer h={16} />
            <TextButton title="Enter code manually" onPress={enterManually} />
          </>
        )}
        {mode === "enter" && (
          <EnterCodeForm
            {...{ onNext, daimoChain, inviteLink, setInviteLink }}
          />
        )}
      </View>
    </View>
  );
}

function EnterCodeForm({
  onNext,
  daimoChain,
  inviteLink,
  setInviteLink,
}: {
  onNext: ({ isTestnet }: { isTestnet: boolean }) => void;
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
  const strippedInviteLink = inviteLink && stripSeedFromNoteLink(inviteLink);
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

  return (
    <View>
      <InputBig
        placeholder="enter invite code"
        value={text}
        onChange={onChange}
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
        onPress={() => onNext({ isTestnet })}
        disabled={!isValid}
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
