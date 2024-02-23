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
import { env } from "../../logic/env";
import { Account, getAccountManager } from "../../model/account";
import { FarcasterClient } from "../../profile/farcaster";
import { QRCodeBox } from "../screen/QRScreen";
import { ButtonMed } from "../shared/Button";
import { FarcasterButton } from "../shared/FarcasterBubble";
import Spacer from "../shared/Spacer";
import { ErrorRowCentered } from "../shared/error";
import image from "../shared/image";
import { color, ss } from "../shared/style";
import { TextBody, TextH3, TextLight } from "../shared/text";
import { useWithAccount } from "../shared/withAccount";

// Connect Farcaster
export function FarcasterBottomSheet() {
  const Inner = useWithAccount(FarcasterBottomSheetInner);
  return <Inner />;
}

const fc = new FarcasterClient();

function FarcasterBottomSheetInner({ account }: { account: Account }) {
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
      const status = await fc.watchStatus({ channelToken });
      if (status.isError) setError(status.error);
      else setData(status.data);
    })();
  }, [fcAccount == null]);

  const isLoading = fcAccount == null && !error && !data;
  const hasFcAccount = fcAccount != null || (!error && data);
  const header = (function () {
    if (!error && data) return "Your account is verified";
    else if (fcAccount != null) return "Your account is linked";
    else return "Connect Farcaster";
  })();
  return (
    <View style={ss.container.screen}>
      <View style={ss.container.padH16}>
        <Spacer h={16} />
        <TextH3>{header}</TextH3>
        <Spacer h={12} />
        {isLoading && url == null && <TextLight>Loading...</TextLight>}
        {isLoading && url != null && <FarcasterQRButton url={url} />}
        {hasFcAccount && <LinkFarcasterSection {...{ account, data }} />}
        {error && <ErrorRowCentered error={error} />}
      </View>
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
        title="OPEN IN WARPCAST"
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
      <TextBody color={color.grayMid}>Welcome, {fcUsername}</TextBody>
      <Spacer h={64} />
      <ProfilePreview fcAccount={fcAcc} />
      <Spacer h={64} />
      <ButtonMed
        type="primary"
        title={linkedAcc ? "REMOVE FROM PROFILE" : "ADD TO PROFILE"}
        onPress={linkedAcc ? unlinkFC : linkFC}
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
  const { rpcFunc } = env(daimoChainFromId(account.homeChainId));
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
