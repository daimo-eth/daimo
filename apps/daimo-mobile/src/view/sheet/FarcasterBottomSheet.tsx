import { StatusAPIResponse } from "@daimo/auth-client";
import { FarcasterLinkedAccount, assert } from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import { useEffect, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { stringToBytes } from "viem";

import { signAsync } from "../../action/sign";
import { env } from "../../logic/env";
import { Account, getAccountManager } from "../../model/account";
import { FarcasterClient } from "../../profile/farcaster";
import { QRCodeBox } from "../screen/QRScreen";
import { ButtonMed } from "../shared/Button";
import { ContactBubble } from "../shared/ContactBubble";
import { FarcasterBubble } from "../shared/FarcasterBubble";
import Spacer from "../shared/Spacer";
import { ErrorRowCentered } from "../shared/error";
import image from "../shared/image";
import { ss } from "../shared/style";
import { TextBody, TextH3, TextLight } from "../shared/text";
import { useWithAccount } from "../shared/withAccount";

// Connect Farcaster
export function FarcasterBottomSheet() {
  const Inner = useWithAccount(FarcasterBottomSheetInner);
  return <Inner />;
}

const fc = new FarcasterClient();

function FarcasterBottomSheetInner({ account }: { account: Account }) {
  // Farcaster AuthKit broken, unusuable in React Native
  const nonce = account.address.substring(2);

  // Use a fork of underlying auth-client instead
  const [error, setError] = useState<Error>();
  const [url, setUrl] = useState<string>();
  const [data, setData] = useState<StatusAPIResponse>();

  // Open a channel; poll for status
  useEffect(() => {
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
  }, []);

  return (
    <View style={ss.container.screen}>
      <View style={ss.container.padH16}>
        <Spacer h={16} />
        <TextH3>{!error && data ? "Connected" : "Connect Farcaster"}</TextH3>
        <Spacer h={12} />
        {!error && !data && url == null && <TextLight>Loading...</TextLight>}
        {!error && !data && url != null && <FarcasterQRButton url={url} />}
        {!error && data && <LinkFarcasterSection {...{ account, data }} />}
        {error && <ErrorRowCentered error={error} />}
      </View>
    </View>
  );
}

function FarcasterQRButton({ url }: { url: string }) {
  return (
    <>
      <QRCodeBox value={url} logoURI={image.qrLogoFarcaster} />
      <Spacer h={16} />
      <ButtonMed
        type="subtle"
        title="OPEN IN WARPCAST"
        onPress={() => Linking.openURL(url)}
      />
    </>
  );
}

function LinkFarcasterSection({
  account,
  data,
}: {
  account: Account;
  data: StatusAPIResponse;
}) {
  console.log("[FARCASTER] got data: " + JSON.stringify(data));
  const fcAccount = FarcasterClient.getLinkedAccount(data);

  const linkFC = async () => {
    console.log("[FARCASTER] link profile");
    const linkedAccountJSON = JSON.stringify(fcAccount);
    const messageBytes = stringToBytes(linkedAccountJSON);
    const signature = await signAsync({ account, messageBytes });

    console.log(`[FARCASTER] linking: ${linkedAccountJSON} sig: ${signature}`);
    const { rpcFunc } = env(daimoChainFromId(account.homeChainId));
    const addr = account.address;
    const linkedAccounts = await rpcFunc.profileLinkAccount.mutate({
      addr,
      linkedAccountJSON,
      signature,
    });

    getAccountManager().transform((a: Account) => ({ ...a, linkedAccounts }));
  };

  return (
    <View>
      <TextBody>Welcome, {data.username}</TextBody>
      <Spacer h={32} />
      <ProfilePreview account={account} fcAccount={fcAccount} />
      <Spacer h={32} />
      <ButtonMed type="primary" title="ADD TO PROFILE" onPress={linkFC} />
    </View>
  );
}

function ProfilePreview({
  account,
  fcAccount,
}: {
  account: Account;
  fcAccount: FarcasterLinkedAccount;
}) {
  const { name, address: addr } = account;
  return (
    <View style={styles.row}>
      <ContactBubble contact={{ type: "eAcc", name, addr }} size={36} />
      <Spacer w={16} />
      <View>
        <TextBody>{name}</TextBody>
        <Spacer h={2} />
        <FarcasterBubble fcAccount={fcAccount} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
