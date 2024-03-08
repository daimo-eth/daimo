import {
  DaimoInviteCodeStatus,
  EAccount,
  formatDaimoLink,
} from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import * as Clipboard from "expo-clipboard";
import { useCallback, useState } from "react";
import {
  StyleSheet,
  Image,
  View,
  TouchableHighlight,
  ImageBackground,
} from "react-native";

import InviteBackground from "../../../assets/invite-background.png";
import InviteCover from "../../../assets/invite-cover.png";
import { navToAccountPage, useExitToHome, useNav } from "../../common/nav";
import { Account } from "../../model/account";
import { ButtonBig, ButtonMed } from "../shared/Button";
import { ButtonCircle } from "../shared/ButtonCircle";
import { ContactBubble } from "../shared/ContactBubble";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { shareURL } from "../shared/shareURL";
import { color, ss, touchHighlightUnderlay } from "../shared/style";
import {
  DaimoText,
  TextBody,
  TextCenter,
  TextH2,
  TextLight,
} from "../shared/text";
import { useWithAccount } from "../shared/withAccount";

export function InviteScreen() {
  const Inner = useWithAccount(InviteScreenInner);
  return <Inner />;
}

function InviteScreenInner({ account }: { account: Account }) {
  const inviteLinkStatus = account.inviteLinkStatus;

  if (!inviteLinkStatus) {
    return (
      <View style={ss.container.padH16}>
        <LockedHeader />
        <LockedFooter />
      </View>
    );
  }

  return (
    <View style={ss.container.padH16}>
      <Header invitees={account.invitees} inviteCodeStatus={inviteLinkStatus} />
      {inviteLinkStatus.isValid ? (
        <ReferralButtonsFooter inviteCodeStatus={inviteLinkStatus} />
      ) : (
        <LockedFooter />
      )}
    </View>
  );
}

function InviteeBubble({ invitee }: { invitee: EAccount }) {
  const nav = useNav();

  const onPress = useCallback(() => {
    navToAccountPage(invitee, nav);
  }, [invitee, nav]);

  return (
    <View style={styles.inviteeBubbleContainer}>
      <ButtonCircle size={64} onPress={onPress}>
        <ContactBubble
          contact={{ type: "eAcc", ...invitee }}
          size={64}
          transparent
        />
      </ButtonCircle>
    </View>
  );
}

function InviteesBubbles({ invitees }: { invitees: EAccount[] }) {
  const displayInvitees = invitees.slice(-3); // Most recent invitees
  const moreInvitees =
    invitees.length > 3 ? invitees.length - displayInvitees.length : 0;

  return (
    <View style={styles.inviteeContainer}>
      {displayInvitees.map((invitee) => (
        <InviteeBubble key={invitee.addr} invitee={invitee} />
      ))}
      {moreInvitees > 0 && (
        <>
          <Spacer w={8} />
          <TextBody color={color.grayMid}>+{moreInvitees} more</TextBody>
        </>
      )}
    </View>
  );
}

function HeaderGraphic({ invitees }: { invitees?: EAccount[] }) {
  return invitees && invitees.length > 0 ? (
    <View style={styles.imgContainer}>
      <ImageBackground source={InviteBackground} style={styles.image}>
        <InviteesBubbles invitees={invitees} />
      </ImageBackground>
    </View>
  ) : (
    <View style={styles.imgContainer}>
      <Image source={InviteCover} style={styles.image} />
    </View>
  );
}

function HeaderCountText({
  invitees,
  usesLeft,
}: {
  invitees?: EAccount[];
  usesLeft?: number;
}) {
  const showInviteesCount = invitees != null && invitees.length > 0;
  const showUsesLeft = usesLeft != null && (showInviteesCount || usesLeft > 0);

  return (
    <View>
      {showInviteesCount && (
        <TextCenter>
          <TextBody color={color.primary}>
            You've invited {invitees?.length}{" "}
            {invitees?.length === 1 ? "friend" : "friends"}
          </TextBody>
        </TextCenter>
      )}
      {showInviteesCount && showUsesLeft && <Spacer h={8} />}
      {showUsesLeft && (
        <TextCenter>
          <TextBody color={showInviteesCount ? color.grayMid : color.primary}>
            {usesLeft} {usesLeft === 1 ? "invite" : "invites"} left
          </TextBody>
        </TextCenter>
      )}
    </View>
  );
}

const headerTitle = "Invite your friends and earn USDC!";

function LockedHeader() {
  const goHome = useExitToHome();

  return (
    <View>
      <ScreenHeader title="Invite Friends" onExit={goHome} />
      <HeaderGraphic />
      <Spacer h={32} />
      <TextCenter>
        <TextH2>{headerTitle}</TextH2>
      </TextCenter>
    </View>
  );
}

function LockedFooter() {
  const nav = useNav();
  const goToSend = () =>
    nav.navigate("SendTab", {
      screen: "SendNav",
      params: { autoFocus: true },
    });

  return (
    <View>
      <Spacer h={32} />
      <TextCenter>
        <Octicons name="lock" size={36} color={color.gray3} />
      </TextCenter>
      <Spacer h={32} />
      <TextCenter>
        <TextBody color={color.gray3}>
          Use Daimo more to unlock invites. Send a payment link to onboard your
          contacts.
        </TextBody>
      </TextCenter>
      <Spacer h={32} />
      <ButtonMed type="primary" title="SEND" onPress={goToSend} />
    </View>
  );
}

function Header({
  invitees,
  inviteCodeStatus,
}: {
  invitees: EAccount[];
  inviteCodeStatus: DaimoInviteCodeStatus;
}) {
  const goHome = useExitToHome();

  return (
    <View>
      <ScreenHeader title="Invite Friends" onExit={goHome} />
      <HeaderGraphic invitees={invitees} />
      <Spacer h={8} />
      <HeaderCountText
        invitees={invitees}
        usesLeft={inviteCodeStatus.usesLeft}
      />
      <Spacer h={32} />
      <TextCenter>
        <TextH2>{headerTitle}</TextH2>
      </TextCenter>
    </View>
  );
}

function ReferralButtonsFooter({
  inviteCodeStatus,
}: {
  inviteCodeStatus: DaimoInviteCodeStatus;
}) {
  const { link, bonusDollarsInvitee, bonusDollarsInviter } = inviteCodeStatus;
  const url = formatDaimoLink(link);

  const bonusSubtitle = (() => {
    if (
      bonusDollarsInvitee &&
      bonusDollarsInviter &&
      bonusDollarsInvitee === bonusDollarsInviter
    ) {
      return ` and we'll send you both $${bonusDollarsInvitee} USDC`;
    } else if (bonusDollarsInvitee) {
      return ` and we'll send them $${bonusDollarsInvitee} USDC`;
    } else if (bonusDollarsInviter) {
      return ` and we'll send you $${bonusDollarsInviter} USDC`;
    } else return "";
  })();

  return (
    <View>
      <Spacer h={32} />
      <TextCenter>
        <TextLight>
          You'll get credit for the invite on their profile{bonusSubtitle}
        </TextLight>
      </TextCenter>
      <Spacer h={32} />
      <View style={styles.referralButtons}>
        <View style={styles.referralHalfScreen}>
          <TextCenter>
            <TextLight>Invite Code</TextLight>
          </TextCenter>
          <Spacer h={8} />
          <InviteCodeCopier code={link.code} url={url} />
        </View>
        <View style={styles.referralHalfScreen}>
          <TextCenter>
            <TextLight>Invite Link</TextLight>
          </TextCenter>
          <Spacer h={8} />
          <ButtonBig
            type="primary"
            title="Share Link"
            onPress={() => shareURL(url)}
          />
        </View>
      </View>
    </View>
  );
}

function InviteCodeCopier({ code, url }: { code: string; url: string }) {
  const [justCopied, setJustCopied] = useState(false);

  const copy = useCallback(async () => {
    await Clipboard.setStringAsync(url);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1000);
  }, [url]);

  return (
    <TouchableHighlight
      style={styles.codeCopier}
      onPress={copy}
      {...touchHighlightUnderlay.subtle}
    >
      <View style={styles.codeView}>
        <DaimoText style={styles.codeFont} numberOfLines={1}>
          {code}
        </DaimoText>
        <Spacer w={4} />
        <Octicons
          name={justCopied ? "check" : "copy"}
          size={16}
          color={color.midnight}
        />
      </View>
    </TouchableHighlight>
  );
}

const styles = StyleSheet.create({
  imgContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    resizeMode: "contain",
    flex: 1,
    aspectRatio: 2.2,
    justifyContent: "center",
    alignItems: "center",
  },
  referralButtons: {
    flexDirection: "row",
  },
  referralHalfScreen: {
    width: "50%",
    paddingHorizontal: 8,
  },
  codeCopier: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 8,
    backgroundColor: color.white,
    borderColor: color.grayLight,
    borderWidth: 1,
    shadowOffset: { height: 2, width: -1 },
    elevation: 2,
    shadowOpacity: 0.1,
  },
  codeView: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  codeFont: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
    textAlign: "center",
    color: color.midnight,
  },
  rowHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingTop: 16,
    paddingHorizontal: 2,
    backgroundColor: color.white,
  },
  inviteeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 8,
  },
  inviteeBubbleContainer: {
    width: 63, // 63 = size - 1, as used by ContactBubble
    height: 63,
    borderRadius: 99,
    marginLeft: -8,
    backgroundColor: color.white,
    shadowOffset: { height: 2, width: -1 },
    elevation: 2,
    shadowOpacity: 0.1,
  },
});
