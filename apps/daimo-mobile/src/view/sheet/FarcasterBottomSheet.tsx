import { StatusAPIResponse } from "@daimo/auth-client";
import {
  FarcasterLinkedAccount,
  OffchainAction,
  assert,
  now,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import { useCallback, useContext, useEffect, useState } from "react";
import { Linking, View } from "react-native";
import { stringToBytes } from "viem";

import { DispatcherContext } from "../../action/dispatch";
import { signAsync } from "../../action/sign";
import { i18n } from "../../i18n";
import { getAccountManager } from "../../logic/accountManager";
import { getRpcFunc } from "../../logic/trpc";
import { FarcasterClient } from "../../profile/farcaster";
import { Account } from "../../storage/account";
import { QRCodeBox } from "../screen/QRScreen";
import { ButtonMed, TextButton } from "../shared/Button";
import { FarcasterButton } from "../shared/FarcasterBubble";
import Spacer from "../shared/Spacer";
import { ErrorRowCentered } from "../shared/error";
import image from "../shared/image";
import { TextBody, TextH3, TextLight } from "../shared/text";
import { useWithAccount } from "../shared/withAccount";
import { useTheme } from "../style/theme";

// Connect Farcaster
export function FarcasterBottomSheet() {
  const Inner = useWithAccount(FarcasterBottomSheetInner);
  return <Inner />;
}

const fc = new FarcasterClient();
const i18 = i18n.farcasterBottom;

function FarcasterBottomSheetInner({ account }: { account: Account }) {
  const { ss } = useTheme();
  const nonce = account.address.substring(2);

  const [error, setError] = useState<Error>();
  const [url, setUrl] = useState<string>();
  const [data, setData] = useState<StatusAPIResponse>();

  // Generalize when needed
  const fcAccount = account.linkedAccounts.find((l) => l.type === "farcaster");

  // Open a channel; poll for status
  useEffect(() => {
    if (fcAccount != null) return;
    (async () => {
      // Create channel, show QR code
      let channelToken: string | undefined;
      try {
        const connectResp = await fc.connect({ nonce });
        assert(nonce === connectResp.nonce, "Nonce mismatch");
        setUrl(connectResp.url);
        channelToken = connectResp.channelToken;
      } catch (e) {
        setError(e as Error);
        return;
      }

      // Wait for the user to open farcaster app and connect
      try {
        const status = await fc.watchStatus({ channelToken });
        setData(status);
      } catch (e: any) {
        setError(e);
      }
    })();
  }, [fcAccount == null]);

  const isLoading = fcAccount == null && !error && !data;
  const hasFcAccount = fcAccount != null || (!error && data);
  const header = (function () {
    if (!error && data) return i18.verified();
    else if (fcAccount != null) return i18.linked();
    else return i18.connect();
  })();

  return (
    <View style={{ ...ss.container.padH16, height: 472 }}>
      <Spacer h={16} />
      <TextH3>{header}</TextH3>
      <Spacer h={12} />
      {isLoading && url == null && <TextLight>{i18.loading()}</TextLight>}
      {isLoading && url != null && <FarcasterQRButton url={url} />}
      {hasFcAccount && <LinkFarcasterSection {...{ account, data }} />}
      {error && <ErrorRowCentered error={error} />}
    </View>
  );
}

function FarcasterQRButton({ url }: { url: string }) {
  const openInWarpcast = useCallback(() => {
    Linking.openURL(url);
  }, [url]);
  useEffect(openInWarpcast, []);
  return (
    <>
      <QRCodeBox value={url} logoURI={image.qrLogoFarcaster} />
      <Spacer h={16} />
      <ButtonMed
        type="subtle"
        title={i18.openWarpcastButton()}
        onPress={openInWarpcast}
      />
    </>
  );
}

function LinkFarcasterSection({
  account,
  data,
}: {
  account: Account;
  data?: StatusAPIResponse;
}) {
  const { color } = useTheme();
  // Account we've already linked
  const linkedAcc = account.linkedAccounts.find((l) => l.type === "farcaster");

  // Account we're either linking, or have already linked
  const fcAcc = (function () {
    if (linkedAcc) return linkedAcc;
    if (!data) throw new Error("No Farcaster account loaded or linked");
    console.log("[FARCASTER] got data: " + JSON.stringify(data));
    return FarcasterClient.getLinkedAccount(data);
  })();
  const fcUsername = FarcasterClient.getDispUsername(fcAcc);

  // Once done, hide the bottom sheet
  const dispatcher = useContext(DispatcherContext);
  useEffect(() => dispatcher.dispatch({ name: "linkFarcaster" }), []);

  const cancelFC = () => dispatcher.dispatch({ name: "hideBottomSheet" });

  const linkFC = async () => {
    console.log("[FARCASTER] link profile");
    const action: OffchainAction = {
      time: now(),
      type: "profileLink",
      link: { addr: account.address, linkedAccount: fcAcc },
    };
    await updateProfileLinks(account, action);
    dispatcher.dispatch({ name: "hideBottomSheet" });
  };

  const unlinkFC = async () => {
    console.log("[FARCASTER] unlink profile");
    const action: OffchainAction = {
      time: now(),
      type: "profileUnlink",
      linkID: { addr: account.address, type: "farcaster", id: fcAcc.id },
    };
    await updateProfileLinks(account, action);
    dispatcher.dispatch({ name: "hideBottomSheet" });
  };

  return (
    <View>
      <TextBody color={color.grayMid}>{i18.welcome(fcUsername)}</TextBody>
      <Spacer h={64} />
      <ProfilePreview fcAccount={fcAcc} />
      <Spacer h={64} />
      <ButtonMed
        type="primary"
        title={linkedAcc ? i18.removeFromProfile() : i18.addToProfile()}
        onPress={linkedAcc ? unlinkFC : linkFC}
      />
      <Spacer h={16} />
      <TextButton
        title={i18n.shared.buttonAction.cancel()}
        onPress={cancelFC}
      />
    </View>
  );
}

async function updateProfileLinks(account: Account, action: OffchainAction) {
  const actionJSON = JSON.stringify(action);
  const messageBytes = stringToBytes(actionJSON);
  const signature = await signAsync({ account, messageBytes });

  console.log(
    `[PROFILE] sending offchain action: ${actionJSON} sig: ${signature}`
  );
  const rpcFunc = getRpcFunc(daimoChainFromId(account.homeChainId));
  const addr = account.address;
  const linkedAccounts = await rpcFunc.updateProfileLinks.mutate({
    addr,
    actionJSON,
    signature,
  });

  getAccountManager().transform((a) => ({ ...a, linkedAccounts }));
}

function ProfilePreview({ fcAccount }: { fcAccount: FarcasterLinkedAccount }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
      }}
    >
      <FarcasterButton fcAccount={fcAccount} />
    </View>
  );
}
