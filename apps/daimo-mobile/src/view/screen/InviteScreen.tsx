import {
  DaimoInviteCodeStatus,
  EAccount,
  formatDaimoLink,
} from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { useCallback, useState } from "react";
import {
  ImageBackground,
  Linking,
  Pressable,
  StyleSheet,
  TouchableHighlight,
  View,
} from "react-native";

import InviteBackground from "../../../assets/invite-background.png";
import { navToAccountPage, useNav } from "../../common/nav";
import { TranslationFunctions } from "../../i18n/i18n-types";
import { shareURL } from "../../logic/externalAction";
import { useI18n } from "../../logic/i18n";
import { Account } from "../../storage/account";
import { ContactBubble } from "../shared/Bubble";
import { ButtonBig, ButtonMed, TextButton } from "../shared/Button";
import { ButtonCircle } from "../shared/ButtonCircle";
import { CoverGraphic } from "../shared/CoverGraphic";
import { PressableText } from "../shared/PressableText";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import image from "../shared/image";
import { color, ss, touchHighlightUnderlay } from "../shared/style";
import {
  DaimoText,
  TextBody,
  TextBtnCaps,
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
  const i18n = useI18n();

  console.log(
    `[INVITE] render ${account.name}, ${JSON.stringify(inviteLinkStatus)}`
  );

  const header =
    account.invitees.length > 0 ? (
      <Header
        invitees={account.invitees}
        inviteLinkStatus={inviteLinkStatus || undefined}
        _i18n={i18n}
      />
    ) : (
      <LockedHeader _i18n={i18n} />
    );

  const footer = inviteLinkStatus?.isValid ? (
    <ReferralButtonsFooter
      inviteCodeStatus={inviteLinkStatus}
      account={account}
      _i18n={i18n}
    />
  ) : (
    <LockedFooter />
  );

  return (
    <View style={ss.container.padH16}>
      {header}
      {footer}
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

function InviteesBubbles({
  invitees,
  _i18n,
}: {
  invitees: EAccount[];
  _i18n: TranslationFunctions;
}) {
  const nav = useNav();
  const i18n = _i18n.invite;

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
          <PressableText
            text={i18n.more({ moreInvitees })}
            onPress={() => nav.push("YourInvites")}
            hitSlop={16}
          />
        </>
      )}
    </View>
  );
}

function HeaderGraphic({
  invitees,
  _i18n,
}: {
  invitees?: EAccount[];
  _i18n: TranslationFunctions;
}) {
  return invitees && invitees.length > 0 ? (
    <View style={styles.imageContainer}>
      <ImageBackground source={InviteBackground} style={styles.image}>
        <InviteesBubbles invitees={invitees} _i18n={_i18n} />
      </ImageBackground>
    </View>
  ) : (
    <CoverGraphic type="invite" />
  );
}

function HeaderCountText({
  invitees,
  usesLeft,
  _i18n,
}: {
  invitees?: EAccount[];
  usesLeft?: number;
  _i18n: TranslationFunctions;
}) {
  const nav = useNav();
  const i18n = _i18n.invite;

  const showInviteesCount = invitees != null && invitees.length > 0;
  const showUsesLeft = usesLeft != null && (showInviteesCount || usesLeft > 0);

  return (
    <View>
      {showInviteesCount && (
        <Pressable
          onPress={() => nav.push("YourInvites")}
          hitSlop={16}
          children={({ pressed }) => (
            <TextCenter>
              <TextBody color={pressed ? color.primaryBgLight : color.primary}>
                {i18n.invited({ invited: invitees?.length })}
              </TextBody>
            </TextCenter>
          )}
        />
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

function LockedHeader({ _i18n }: { _i18n: TranslationFunctions }) {
  const i18n = _i18n.invite;
  return (
    <View>
      <ScreenHeader title={i18n.screenHeader()} />
      <HeaderGraphic _i18n={_i18n} />
      <Spacer h={32} />
      <TextCenter>
        <TextH2>{i18n.locked.header()}</TextH2>
      </TextCenter>
    </View>
  );
}

function LockedFooter() {
  const nav = useNav();
  const i18n = useI18n().invite;
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
        <TextBody color={color.gray3}>{i18n.locked.description()}</TextBody>
      </TextCenter>
      <Spacer h={32} />
      <ButtonMed type="primary" title={i18n.sendButton()} onPress={goToSend} />
    </View>
  );
}

function Header({
  invitees,
  inviteLinkStatus,
  _i18n,
}: {
  invitees: EAccount[];
  inviteLinkStatus?: DaimoInviteCodeStatus;
  _i18n: TranslationFunctions;
}) {
  const i18n = _i18n.invite;
  return (
    <View>
      <ScreenHeader title={i18n.screenHeader()} />
      <HeaderGraphic invitees={invitees} _i18n={_i18n} />
      <Spacer h={8} />
      <HeaderCountText
        invitees={invitees}
        usesLeft={inviteLinkStatus?.usesLeft}
        _i18n={_i18n}
      />
      <Spacer h={32} />
      <TextCenter>
        <TextH2>{i18n.locked.header()}</TextH2>
      </TextCenter>
    </View>
  );
}

function ReferralButtonsFooter({
  inviteCodeStatus,
  account,
  _i18n,
}: {
  inviteCodeStatus: DaimoInviteCodeStatus;
  account: Account;
  _i18n: TranslationFunctions;
}) {
  const { link, bonusDollarsInvitee, bonusDollarsInviter } = inviteCodeStatus;
  const url = formatDaimoLink(link);
  const i18n = _i18n.invite;

  const bonusSubtitle = (() => {
    if (
      bonusDollarsInvitee &&
      bonusDollarsInviter &&
      bonusDollarsInvitee === bonusDollarsInviter
    ) {
      return i18n.referral.bonusBoth({ bonusDollarsInvitee });
    } else if (bonusDollarsInvitee) {
      return i18n.referral.bonusInvitee({ bonusDollarsInvitee });
    } else if (bonusDollarsInviter) {
      return i18n.referral.bonusInviter({ bonusDollarsInviter });
    } else return "";
  })();

  const shareFarcaster = () => {
    console.log(`[INVITE] share on farcaster`);
    const msg = i18n.referral.share.farcasterMsg();
    const frameUrl = `https://daimo.com/frame/invite/${account.address}`;
    const url = `https://warpcast.com/~/compose?text=${msg}&embeds[]=${frameUrl}`;
    Linking.openURL(url);
  };

  return (
    <View>
      <Spacer h={32} />
      <TextCenter>
        <TextLight>
          {i18n.referral.creditForInvite({ bonusSubtitle })}
        </TextLight>
      </TextCenter>
      <Spacer h={32} />
      <View style={styles.referralButtons}>
        <View style={styles.referralHalfScreen}>
          <TextCenter>
            <TextLight>{i18n.referral.inviteCode()}</TextLight>
          </TextCenter>
          <Spacer h={8} />
          <InviteCodeCopier code={link.code} url={url} />
        </View>
        <View style={styles.referralHalfScreen}>
          <TextCenter>
            <TextLight>{i18n.referral.inviteLink()}</TextLight>
          </TextCenter>
          <Spacer h={8} />
          <ButtonBig
            type="primary"
            title="Share Link"
            onPress={() => shareURL(link)}
          />
        </View>
      </View>
      <Spacer h={16} />
      <View>
        <TextButton onPress={shareFarcaster}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={{ uri: image.iconFarcaster }}
              style={{ width: 16, height: 16, zIndex: -1 }}
            />
            <Spacer w={8} />
            <TextBtnCaps color={color.grayDark}>
              {i18n.referral.share.farcasterButton()}
            </TextBtnCaps>
          </View>
        </TextButton>
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
  imageContainer: {
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
    ...ss.container.shadow,
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
